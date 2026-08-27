# Lacunas do regressivo — o que ninguém mapeou ainda

> **Status: proposta para avaliação. Nada aqui foi implementado.**
> Nenhum teste foi escrito, nenhuma spec alterada, nenhum Page Object tocado.
> A investigação foi **de leitura** — GETs na API v2 com a sessão do `storageState`, enquanto a
> suíte completa rodava contra o mesmo ambiente. **Nada foi criado, movimentado ou cancelado.**

Data: 27/08/2026 · Base: `docs/cobertura.md`, `docs/catalogo-casos.md`, `docs/estado-do-gate.md`,
`README.md`, `tests/**`, e a skill `cassi-fluig-master` (catálogo dos 34 processos, contratos de
cancelamento, artefatos não-processo).

**O que este documento NÃO é:** não repete nenhum dos 30 casos já registrados como lacuna em
`docs/cobertura.md`. Aqueles têm motivo medido e dono. Aqui estão **26 lacunas novas** — coisas
que o regressivo deveria cobrir e que hoje não aparecem em lugar nenhum, nem como teste, nem como
motivo de ausência.

---

## Antes de implementar qualquer um destes casos

1. **O ID precisa entrar em `docs/catalogo-casos.md` primeiro.** `npm run cobertura` falha se um
   teste citar um ID que não existe no catálogo. Os IDs abaixo são **sugestões** e foram escolhidos
   para não colidir com os 163 existentes (conferido contra os prefixos `CT-ACC`, `CT-ADM`,
   `CT-AUT`, `CT-BH`, `CT-CLI`, `CT-CMP`, `CT-COT`, `CT-DEL`, `CT-DEP`, `CT-E2E`, `CT-FAT`,
   `CT-FER`, `CT-FOR`, `CT-GED`, `CT-INT`, `CT-JUR`, `CT-NEG`, `CT-NOT`, `CT-OCO`, `CT-PAR`,
   `CT-PFN`, `CT-PLT`, `CT-RDF`, `CT-SEG`, `CT-SUB`, `CT-TSK`). Duas famílias novas: `CT-FIN`
   (Financeiro) e `CT-A11Y`.
2. **Valem as regras da suíte**: cada teste cria a própria massa, nada depende de ordem, massa
   fictícia de factory com prefixo `QA`, assertion sobre comportamento observável, e **vermelho
   intencional é a convenção** — teste escrito contra o comportamento esperado que o produto não
   entrega deve reprovar.
3. **Cenário que escreve leva `@destrutivo`** e entra no ritmo controlado (um por vez, 60s de
   intervalo), pela proteção de volume do Fluig.

---

## Sumário — as 26 lacunas, por valor

| # | ID sugerido | Título | Prio | Viável hoje? |
|---|---|---|---|---|
| 1 | `CT-SEG-07-S1` | Isolamento horizontal na API v2 de processos (BOLA) | **P1** | ✅ leitura pura — **defeito já medido** |
| 2 | `CT-CMP-07-S1` | Regressão do fail-open do formulário clássico | **P1** | ✅ com `@destrutivo` |
| 3 | `CT-TSK-05-H` | Cancelar solicitação — o fluxo do produto, nunca testado | **P1** | ✅ com `@destrutivo` |
| 4 | `CT-CMP-08-H` | Fechar o ciclo de retorno: reprovação → Correção → reenvio | **P1** | ✅ com `@destrutivo` |
| 5 | `CT-SEG-08-S1` | Processos administrativos abertos a usuário comum | **P1** | ✅ leitura pura |
| 6 | `CT-TSK-05-S1` | Cancelamento sem motivo derruba com NPE 500 | P2 | ✅ leitura/negativo |
| 7 | `CT-GED-02-S2` | Bloqueio de extensão: allowlist, não blacklist do `.exe` | P2 | ✅ com `@destrutivo` |
| 8 | `CT-ACC-09-H` | O caminho FELIZ do anexo da SC nunca foi provado | P2 | ✅ com `@destrutivo` |
| 9 | `CT-RDF-02-H` | Rastreabilidade pai↔filho do RDFC (`WKNumProcesPai`) | P2 | ✅ leitura pura |
| 10 | `CT-PLT-06-S1` | Erro de console fora da home (inclui o NPS 403) | P2 | ✅ leitura pura |
| 11 | `CT-PLT-04-S2` | Deep-link além das duas rotas de hoje | P2 | ✅ leitura pura |
| 12 | `CT-PLT-10-H` | Invariante do catálogo: 34 publicados / 17 iniciáveis | P2 | ✅ leitura pura |
| 13 | `CT-TSK-07-H` | "Somente salvar" — salvar sem movimentar | P2 | ✅ com `@destrutivo` |
| 14 | `CT-TSK-08-H` | Transferir atividade (a suíte só lista a aba) | P2 | ⚠️ irreversível |
| 15 | `CT-FAT-04-H` | Faturamento: retorno pela Correção e fila do Protheus | P2 | ⚠️ depende de etapa fora da conta |
| 16 | `CT-JUR-06-H` | Contencioso: nasce no pool certo? (a suíte cria e larga) | P2 | ✅ leitura pura |
| 17 | `CT-SEG-10-S1` | ACL dos documentos que a SC cria sozinha no GED | P2 | ✅ leitura pura |
| 18 | `CT-FIN-01-H` | Rejeições de Pagamentos — área inteira sem cobertura | P2 | ✅ leitura pura |
| 19 | `CT-SUB-02-H` | Delegação de Tarefas (`wf_SubstituiçãoCargosFluig`) | P2 | ✅ leitura pura |
| 20 | `CT-GED-04-S1` | Rejeitar documento — o caminho e o `msgId` que mente | P3 | ✅ com `@destrutivo` |
| 21 | `CT-PLT-09-S1` | Fechar a matriz dos 9 bloqueios duros (Súmulas) | P3 | ✅ leitura pura |
| 22 | `CT-PLT-08-S1` | Processo inativo e resíduo de desenvolvimento visível | P3 | ✅ leitura pura |
| 23 | `CT-NOT-03-S1` | Contratos da API de notificação (paginação morta) | P3 | ✅ leitura pura |
| 24 | `CT-PLT-07-S1` | `addFavorites` duplicado responde 500 em texto puro | P3 | ✅ com `@destrutivo` |
| 25 | `CT-CLI-03-H` | Questionário: estado pós-criação nunca verificado | P3 | ✅ com `@destrutivo` |
| 26 | `CT-A11Y-01-S1` | Nenhum teste de acessibilidade na suíte | P3 | ⚠️ exige dependência nova |
| 27 | `CT-TSK-06-S1` | Cascata SC → Cotação no cancelamento | — | ❌ **bloqueado por D-01** |

---

# P1 — o que eu implementaria primeiro

### `CT-SEG-07-S1` · Isolamento horizontal na API v2 de processos (BOLA/IDOR interno)

- **Prioridade: P1** — é o achado mais grave desta investigação, e é o único caso aqui que já vem
  com **defeito medido**, não com hipótese. Vale mais que qualquer cobertura funcional pendente:
  expõe dado de fornecedor a qualquer sessão autenticada da plataforma.
- **Tipo:** Segurança (controle de acesso horizontal / BOLA — *Broken Object Level Authorization*).
- **Por que falta:** a suíte tem `CT-SEG-05-S1` (acesso admin negado a não-admin — **vertical**) e
  `CT-SEG-01-S1` (vazamento do dataset `colleague`). **Não há nenhum teste de autorização
  horizontal**: um usuário autenticado lendo o objeto de outro. E o `CT-PFN-07-S1` (IDOR entre
  fornecedores) está registrado como lacuna por falta de duas contas — o que escondeu que o IDOR
  **dentro da plataforma** é testável com uma conta só.

  **Medido em 27/08/2026, leitura pura, com a sessão de `TOTVS-FS`** (perfil Compras/Contratos,
  não-admin):

  ```
  GET /process-management/api/v2/requests/111694?expand=formFields   → 200
  ```

  A instância 111694 é do processo `bpm_recepcao_documentos_fiscais_compras` — **exatamente um dos
  processos que o próprio ambiente barra para esta conta** com *"Usuário TOTVS-FS não possui
  permissão para iniciar solicitações do processo…"*. Ela foi criada e conduzida pela conta de
  integração `integration-cass-0000-0000-0001-1` (confirmado em `/requests/111694/tasks`), e
  `TOTVS-FS` **nunca participou de nenhuma etapa dela**. Ainda assim o corpo devolve os formFields
  completos, incluindo razão social do fornecedor (`nomeSolicitante: "STAR COMERCIAL LTDA"`),
  **CNPJ** (`cpfCnpj: "02450751000135"`), chave da Pré-Nota, nº da SC, códigos de produto,
  quantidades e valores. O mesmo vale para o subprocesso 111901.

  **O risco concreto:** o `processInstanceId` é sequencial. Qualquer sessão autenticada — inclusive
  a de um estagiário de outra área — enumera a base inteira de documentos fiscais, contratos e
  processos jurídicos com um laço de `for`. É o mesmo tipo de exposição do vazamento `colleague`
  já catalogado, mas sobre dado de transação, não de cadastro.
- **Pré-condições:** sessão autenticada de `TOTVS-FS`; um `processInstanceId` de um processo em que
  a conta comprovadamente **não** participa e que ela **não** tem permissão de iniciar. O teste
  deve **descobrir** esse id em tempo de execução (varrer `/requests?pageSize=100` procurando
  `processId` começando por `bpm_recepcao_documentos_fiscais`), nunca fixá-lo numa constante — a
  regra de massa da suíte vale aqui igual.
- **Passos:**
  1. Autenticar com `storageState` e abrir uma página do portal (o WAF barra `page.request`).
  2. Via `page.evaluate` + `fetch`, listar `/process-management/api/v2/requests?pageSize=100`
     e selecionar a primeira instância de um processo bloqueado por permissão para a conta.
  3. Confirmar a não-participação: `GET /requests/<id>/tasks?pageSize=60` não traz nenhum
     `assignee.code` nem `requester.code` igual ao login da automação.
  4. `GET /requests/<id>?expand=formFields`.
- **Resultado esperado (critério objetivo):** o passo 4 deve responder **403** (ou 404, ou 200 com
  `formFields: null`) para uma instância em que o usuário não é requisitante, responsável atual nem
  participante histórico. **Hoje responde 200 com o formulário inteiro — o teste reprova de
  propósito**, como os demais vermelhos intencionais da suíte. A assertion não pode ser sobre "não
  contém CNPJ": tem de ser sobre o *status* e a ausência do objeto, senão vira teste de string.
- **Custo/viabilidade:** **alcançável hoje, sem provisionamento nenhum.** Leitura pura, ~3 GETs,
  segundos de execução, sem `@destrutivo`. É o melhor retorno por linha de código do documento
  inteiro. Recomendo abrir chamado de segurança em paralelo, sem esperar o teste.

---

### `CT-CMP-07-S1` · Regressão do fail-open do formulário clássico de SC

- **Prioridade: P1** — é o defeito mais severo do README (**cria SC de formulário vazio**) e é o
  único da tabela de defeitos que **não tem teste próprio**. Foi descoberto de raspão, ao rodar os
  destrutivos, e está documentado em prosa em `estado-do-gate.md`. No dia em que for corrigido,
  nada garante que não volta.
- **Tipo:** Regressão / Negativo.
- **Por que falta:** `CT-CMP-02-S1` cobre "campos obrigatórios vazios" com o formulário **já
  montado**. O fail-open é outro fenômeno: enquanto o overlay `blockUI` ainda cobre a tela, o
  clique em Enviar **não passa por validação nenhuma** e o Fluig dispara
  `POST /ecm/api/rest/ecm/workflowView/send` direto. Medido em 2 de 9 cargas sem concorrência, e
  **de forma persistente** quando `ds_protheus_getMatriculaTitular_rest` responde 500
  (`WFLYEJB0054: Failed to marshal EJB parameters`). Sem teste, a correção não tem oráculo — e a
  janela é probabilística, então ninguém a reencontra por acaso.
  **Risco concreto:** SC em branco chega ao Gestor Imediato e ao Protheus. É corrupção de dado de
  negócio, não incômodo de UI.
- **Pré-condições:** conta da automação; `page.route` interceptando
  `ds_protheus_getMatriculaTitular_rest` para responder **500** — é isso que torna a janela
  **determinística** em vez de 2-em-9. Sem essa interceptação o teste é flaky por construção e não
  deve ser escrito.
- **Passos:**
  1. Interceptar `ds_protheus_getMatriculaTitular_rest` → HTTP 500 (o erro real observado).
  2. Abrir o formulário clássico de `wf_solicitacao_compras`.
  3. **Sem preencher nada**, e com o `blockUI` ainda visível, clicar em Enviar.
  4. Contar as requisições que saíram para `**/workflowView/send`.
- **Resultado esperado:** **zero** requisições de start. O produto deve manter o Enviar inerte (ou
  desabilitado) enquanto a montagem não terminar, e nunca aceitar submissão de formulário não
  montado. Hoje o `send` sai e o servidor devolve `processInstanceId` real → **vermelho
  intencional**.
- **Custo/viabilidade:** alcançável hoje. Leva `@destrutivo` porque, com o defeito presente, o
  teste **cria uma SC** — que o `globalTeardown` cancela pelo livro-razão. Cuidado registrado:
  abortar o `send` mudaria o comportamento do widget (armadilha já paga por esta suíte); o oráculo
  correto é **contar a tentativa**, deixando-a passar.

---

### `CT-TSK-05-H` · Cancelar solicitação — o fluxo do produto, nunca testado

- **Prioridade: P1** — a suíte **depende** deste endpoint no `globalTeardown` para limpar toda a
  massa de todas as execuções, e **nunca o testou como funcionalidade**. Se o cancelamento quebrar
  no produto, a suíte descobre pelo acúmulo de lixo na base, não por um vermelho.
- **Tipo:** Funcional (e infraestrutura da própria suíte).
- **Por que falta:** `grep -ril cancel tests/` devolve só `grade-contratos` (o status truncado
  `Cancel.` do D-08) e `portal-fornecedor`. **Não existe um único caso de cancelamento no catálogo
  de 163.** É um buraco de área, não de cenário: o cancelamento é a única saída não-destrutiva de
  uma solicitação neste ambiente, aparece em três telas diferentes com **três endpoints diferentes**
  (Central de Tarefas, Consultar Solicitações e Eliminar Solicitações — o terceiro nem cancela,
  apaga), e nenhum deles tem cobertura.
  **Risco concreto:** o botão Cancelar some da Central, ou passa a exigir perfil que o usuário não
  tem, e ninguém percebe até a base entupir.
- **Pré-condições:** uma solicitação criada **pelo próprio teste** (nunca reaproveitar id de outro
  teste — regra de independência), em estado `OPEN`.
- **Passos:**
  1. Criar uma SC com massa `QA` de factory.
  2. Abrir Central de Tarefas → *Minhas solicitações*, localizar o card pela paginação por cursor
     (reusar `utils/central-tarefas-paginacao.js` — a listagem é crescente e `rows=15`, armadilha
     já mapeada).
  3. Acionar **Cancelar**, informar o motivo (prefixo `QA`).
  4. Reler o estado **no servidor**: `GET /process-management/api/v2/requests/<id>` e
     `GET /requests/<id>/tasks?pageSize=60`.
- **Resultado esperado:** `status: CANCELED`, `active: false`, a tarefa da etapa corrente com
  status `CANCELED`, e o card ausente da listagem de abertas. A confirmação vem **do servidor**, não
  do toast — mesma disciplina já adotada em `scripts/limpar-massa.mjs` (`successCount` é o que ele
  diz ter feito; `status: CANCELED` é o que aconteceu).
- **Custo/viabilidade:** alcançável hoje, `@destrutivo`. Custo de massa: 1 SC por execução — que o
  teste já destrói ele mesmo, então é o destrutivo **mais barato** da suíte em resíduo.

---

### `CT-CMP-08-H` · Fechar o ciclo de retorno: reprovação → Correção → reenvio

- **Prioridade: P1** — é o exemplo canônico de "fluxo que a suíte toca mas não fecha". Hoje
  `CT-E2E-02-S1` e `CT-CMP-04-S1` provam que a **reprovação devolve** a SC; ninguém prova que dá
  para **corrigir e reenviar**. O caminho de retorno é metade do processo e está sem oráculo.
- **Tipo:** Funcional (caminho de exceção completo).
- **Por que falta:** o BPMN da SC tem a etapa **236 "Correção"** e a suíte tem o vocabulário dela
  (`Ajustar Informações` aparece nos títulos), mas nenhum teste assume essa tarefa, edita e
  reenvia. **Risco concreto:** o usuário reprovado fica com a SC presa — os dados do contrato se
  perdem no retorno, ou o reenvio não volta para o Gestor e sim para o Início. É defeito de altíssimo
  impacto operacional que hoje passaria batido, e é vizinho direto do D-01 (que é exatamente um
  problema de para-onde-a-tarefa-vai).
- **Pré-condições:** SC criada pelo teste; a conta precisa conseguir assumir o pool do Gestor
  Imediato (`G.P.Requisicao_de_Compras_Gestor_Imediato`) — **já provado alcançável** pelos testes de
  `ciclo-gestor.spec.js`. Só é executável pela rota de start corrigido (`targetState` de gateway);
  pela rota do widget, o D-01 prende a SC no Início e o cenário não existe.
- **Passos:**
  1. Criar a SC e levá-la até *Validação do Gestor*.
  2. Assumir do pool e **reprovar** com justificativa `QA`.
  3. Confirmar que a SC voltou para a etapa de Correção **com o solicitante**.
  4. Abrir a tarefa de Correção, alterar um campo identificável (ex.: justificativa `QA-CORR-<sufixo>`).
  5. Reenviar.
  6. Reler estado e histórico no servidor.
- **Resultado esperado:** depois do reenvio a SC volta para *Validação do Gestor* (não para
  "Início"), o campo alterado persiste, e **os dados do contrato de origem continuam íntegros** —
  nº do contrato, revisão, filial e itens iguais aos do start. O histórico registra a passagem pela
  Correção.
- **Custo/viabilidade:** alcançável hoje, `@destrutivo`, mas é o caso **mais caro** da lista: ~4
  movimentações e uma tarefa assumida de pool que **não tem devolução** (resíduo permanente na caixa
  "Tarefas a concluir" — custo do cenário, não algo a desfazer no teardown). Vale o preço.

---

### `CT-SEG-08-S1` · Processos administrativos abertos a usuário comum

- **Prioridade: P1** — mesma classe de achado que a segregação de RH já registrada como pergunta
  aberta no README, mas com alvo pior: **criação de usuário e de grupo na plataforma**.
- **Tipo:** Segurança (segregação de função).
- **Por que falta:** `bpm_addUserFluig` e `bpm_addUserGroup` constam do catálogo `onlyCanStart`
  do `TOTVS-FS` e **abrem o formulário de início** (medido 26/08 pela skill). O teste
  `bloqueio-processos-rh.spec.js` documenta o mesmo fenômeno para os 5 processos de RH — com
  anotação de achado e tudo — mas **não cobre os dois administrativos**, que são de gravidade maior.
  **Risco concreto:** se o processo funcionar de ponta a ponta, um usuário de Compras cria conta e
  grupo no Fluig. É escalada de privilégio por processo de negócio, contornando qualquer controle da
  tela de administração (que, essa sim, o `CT-SEG-05-S1` prova estar barrada).
- **Pré-condições:** nenhuma além da sessão.
- **Passos:**
  1. `GET /ecm/api/rest/ecm/process-category/processes?...&onlyCanStart=true` e verificar a
     presença dos dois ids.
  2. Abrir `/portal/p/1/pageworkflowview?processID=bpm_addUserFluig` e o mesmo para
     `bpm_addUserGroup`.
  3. Com `utils/guarda-criacao.js` ativo, afirmar `guarda.tentativas() === 0`. **Nunca clicar em
     Enviar** — criar usuário na base é escrita fora da política, mesmo em homologação.
- **Resultado esperado:** os dois processos **não** devem constar do catálogo de início da conta e
  **não** devem abrir formulário — devem responder com o diálogo *Erro* e a mensagem de permissão,
  como `wf_solicitacao_ferias` e os RDFC. Hoje abrem → vermelho intencional, com
  `testInfo.annotations` de achado, no mesmo padrão do teste de RH.
- **Custo/viabilidade:** alcançável hoje, leitura pura, minutos de implementação. Reaproveita
  integralmente `FormularioProcessoPage` e o padrão parametrizado que já existe em
  `bloqueio-processos-rh.spec.js`.

---

# P2 — o que fecha os buracos estruturais

### `CT-TSK-05-S1` · Cancelamento sem motivo derruba com NPE 500

- **Prioridade: P2** — regressão de contrato do endpoint de que a limpeza da suíte depende.
- **Tipo:** Negativo / Integração.
- **Por que falta:** está medido na skill (`cancelText: null` → **NPE 500 sem efeito**) e não há
  teste. O risco não é o 500 — é o **"sem efeito"** ser silencioso: um dia a validação vira
  "cancela mesmo assim com motivo vazio", ou pior, o 500 passa a cancelar parcialmente um lote.
- **Pré-condições:** uma solicitação criada pelo teste (pode ser a mesma de `CT-TSK-05-H`, em outro
  teste independente que cria a sua própria).
- **Passos:** `POST /api/public/2.0/workflows/cancelInstances` com `cancelText: null`, depois reler
  o estado no servidor.
- **Resultado esperado:** resposta de erro **de negócio** (4xx com mensagem nomeando o campo
  obrigatório), não 500 de NPE; e a solicitação **permanece `OPEN`**. A segunda metade é a que
  importa: o teste falha se o estado mudar.
- **Custo/viabilidade:** alcançável hoje. `@destrutivo` pela criação da massa, mas a chamada em si
  não escreve.

### `CT-GED-02-S2` · Bloqueio de extensão: allowlist, não blacklist do `.exe`

- **Prioridade: P2** — regressão que impede uma correção cosmética de fechar o defeito.
- **Tipo:** Regressão / Segurança.
- **Por que falta:** `CT-GED-02-S1` prova que o `.exe` é aceito e publicado. O caminho de correção
  mais provável (e mais errado) é adicionar `.exe` a uma lista negra. **Risco concreto:** a suíte
  fica verde, o GED continua aceitando `.bat`, `.sh`, `.js`, `.hta` e o clássico `relatorio.pdf.exe`.
  Sem este caso, a correção é declarada e não verificada.
- **Pré-condições:** as mesmas de `CT-GED-02-S1`, incluindo o lock `fluig-upload-staging` de
  `utils/exclusividade.js` — a área de upload é **por usuário no servidor**, não por aba.
- **Passos:** publicar, um por vez, arquivos de factory com extensões `.bat`, `.sh`, `.pdf.exe` e
  um `.exe` renomeado para `.pdf` (conteúdo com os magic bytes `MZ`), cada um em seu próprio teste.
- **Resultado esperado:** todos rejeitados **com mensagem de bloqueio**, e nada gravado
  (`guarda.tentativas() === 0` ou ausência do documento na pasta). O caso do `.exe` renomeado é
  separado: se o produto validar só a extensão do nome, ele passa — e a assertion deve dizer isso
  na mensagem de falha, para que o leitor do relatório saiba que a validação é sintática.
- **Custo/viabilidade:** alcançável hoje, `@destrutivo`. Custo de massa: cada arquivo aceito vira
  documento a limpar por `navigation/removeDoc` → `recycleBin/removeDocument`.

### `CT-ACC-09-H` · O caminho FELIZ do anexo da SC nunca foi provado

- **Prioridade: P2** — a suíte prova exaustivamente que a SC nasce **sem** o anexo obrigatório
  (`CT-CMP-02-S4`, cliente e servidor). Ninguém prova que, quando o anexo **é** enviado, ele chega
  íntegro e recuperável.
- **Tipo:** Funcional / Integração.
- **Por que falta:** medido pela skill: o anexo vira **dois** documentos no GED — um
  `documentType: "7"` com `parentDocumentId: -1` (fora da árvore) e uma cópia `documentType: "2"`
  dentro de uma cadeia de pastas que o produto cria sozinho por solicitação
  (`Anexos de Processo de Compras > Requisição de Compra… > Processo <nº> > Solicitação <nº>`).
  **Risco concreto:** a dupla gravação quebra e o anexo some da tarefa; ou a cadeia de pastas deixa
  de ser criada e o anexo fica órfão em `parentDocumentId: -1`, inalcançável para o aprovador. Nada
  hoje detecta isso.
- **Pré-condições:** SC criada pelo teste, com um anexo de factory (`QA-anexo-<sufixo>.pdf`).
- **Passos:** criar a SC com anexo → ler o nº da solicitação → consultar o dataset `document` com
  constraint pelo nome do anexo → verificar os dois registros e a cadeia de pastas → abrir a
  solicitação e confirmar o anexo listado na aba Anexos.
- **Resultado esperado:** os dois registros existem, a cópia navegável está sob a pasta da
  solicitação criada, e o anexo é listado na tarefa. Nomes com o sufixo único, para não colidir com
  os **140 registros** de anexo já acumulados na base.
- **Custo/viabilidade:** alcançável hoje, `@destrutivo`. **Resíduo permanente**: anexo de SC e sua
  cadeia de pastas não podem ser apagados (apagá-los é mexer na solicitação). Um por execução.

### `CT-RDF-02-H` · Rastreabilidade pai↔filho do RDFC

- **Prioridade: P2** — os 5 processos RDFC estão bloqueados para iniciar, e por isso a suíte tratou
  a área como inalcançável. Mas a **leitura** das instâncias existentes é alcançável e nunca foi
  usada como oráculo.
- **Tipo:** Integração (contrato de dados).
- **Por que falta:** o RDFC é o **único subprocesso Fluig genuíno** do ambiente, e o elo pai→filho
  **não está em `parentRequestId`** — ele vem `null` mesmo para filhos reais (confirmado de novo em
  27/08: a instância 111901, filha de 111694, traz `parentRequestId: null`). O elo real é o campo
  `WKNumProcesPai` nos formFields do filho, e `COM_SOLICITACAO_FLUIG___n` /
  `DEM_SOLICITACAO_FLUIG___n` no pai. **Risco concreto:** a criação de subprocessos falha
  parcialmente (pai aponta para filho que não existe, ou filho responde e o pai não é atualizado) e
  o processo fiscal trava sem sinal. Hoje só se descobre por reclamação.
- **Pré-condições:** existir ao menos um par pai/filho na base — o teste **descobre** o par varrendo
  `/requests`, não fixa ids.
- **Passos:** para cada filho RDFC encontrado, ler `WKNumProcesPai`; ler o pai correspondente e
  conferir que ele lista o filho em `*_SOLICITACAO_FLUIG___n`; conferir que a etapa "Atualiza
  solicitação principal" do filho está `COMPLETED` quando o filho está finalizado.
- **Resultado esperado:** o elo é **bidirecional e consistente** para todo par encontrado. Se a
  base não tiver nenhum par, falhar com `PRÉ-CONDIÇÃO AUSENTE` nomeando o que falta — nunca passar
  vazio (o padrão de falso verde que o estudo de determinismo já pegou uma vez).
- **Custo/viabilidade:** alcançável hoje, leitura pura, sem provisionamento. ⚠️ Depende do
  `CT-SEG-07-S1`: **se o isolamento horizontal for corrigido, este teste perde o acesso** e passa a
  exigir uma conta com perfil fiscal. Registre a dependência ao implementar.

### `CT-PLT-06-S1` · Erro de console fora da home

- **Prioridade: P2** — cobertura transversal barata que hoje existe em **uma** tela só.
- **Tipo:** Funcional / Regressão.
- **Por que falta:** só `home.spec.js` verifica console (`deve carregar os apps e contadores sem
  erro de console`). O `NPS 403` (`GET /nps/api/v1/surveys` → 403 em toda carga) está na tabela de
  defeitos do README **sem teste próprio** — vive de carona nessa assertion da home. E nenhuma das
  outras ~15 telas principais tem guarda de console. **Risco concreto:** exceção de JS numa tela de
  Compras degrada silenciosamente o widget e a suíte só percebe se a degradação atingir o elemento
  que o teste já espera.
- **Pré-condições:** nenhuma.
- **Passos:** teste parametrizado sobre as rotas-chave (home, catálogo, Central de Tarefas, Portal
  de Contratos, Portal do Comprador, Gerência de Compras, Tracker, GED), coletando `pageerror` e
  `console.error` durante a carga.
- **Resultado esperado:** zero erro de console não catalogado. Os conhecidos (NPS 403) entram numa
  **lista de exceções nomeada e datada** no próprio teste — não num filtro genérico por regex, que
  esconderia os novos.
- **Custo/viabilidade:** alcançável hoje, leitura pura. Cuidado: a suíte tem `google-analytics` a
  bloquear (`CT-SEG-06-S1`) — o ruído de rede precisa ser separado do ruído de JS.

### `CT-PLT-04-S2` · Deep-link além das duas rotas de hoje

- **Prioridade: P2** — o teste do U-01 cobre `/principalprocess` e `/gestao_ferias`. A skill mediu
  que **`/portal/p/1/notificationcenter` também renderiza "Recurso não foi encontrado."**, e essa
  rota não está no teste.
- **Tipo:** Regressão.
- **Por que falta:** o U-01 foi registrado com duas rotas de amostra. Como a correção provável é
  no roteamento da SPA (não rota a rota), **um conjunto maior de rotas é o que distingue "corrigido"
  de "remendado"**. Risco concreto: corrigem as duas do teste e o link salvo do usuário continua
  quebrado nas demais.
- **Pré-condições:** nenhuma.
- **Passos:** estender a lista parametrizada de `deep-link-spa.spec.js` com as rotas SPA
  navegáveis restantes, descobertas pelo menu (inclusive `notificationcenter`).
- **Resultado esperado:** nenhuma cai em `errorPage/404`. Vermelho intencional enquanto o U-01
  viver.
- **Custo/viabilidade:** alcançável hoje, é praticamente só dados. O trabalho real é **inventariar**
  as rotas SPA pelo menu — meia hora de navegação de leitura.

### `CT-PLT-10-H` · Invariante do catálogo de processos

- **Prioridade: P2** — a suíte testa o catálogo como **tela** (`catalogo-processos.spec.js`:
  "deve listar os processos e responder à busca") e nunca como **inventário**.
- **Tipo:** Integração (contrato) / Regressão.
- **Por que falta:** a skill mediu números exatos — **34 publicados (32 ativos), 17 no catálogo
  `onlyCanStart`, 21 que abrem de fato, 9 com bloqueio duro de permissão**. Nada guarda esses
  números. **Risco concreto:** alguém publica um processo novo, despublica um em uso, ou muda a
  permissão de início de um processo sensível, e a suíte inteira continua verde. Este é o teste que
  transforma o catálogo da skill em **oráculo executável** em vez de documento que envelhece.
- **Pré-condições:** nenhuma.
- **Passos:** `GET /process-management/api/v2/processes?pageSize=200` e
  `GET /ecm/api/rest/ecm/process-category/processes?...&onlyCanStart=true`; comparar contra a lista
  esperada, versionada no teste.
- **Resultado esperado:** o conjunto de `processId` publicados e o conjunto de iniciáveis batem
  exatamente com o esperado. Diferença → falha nomeando **qual** processo entrou ou saiu (não "34 ≠
  35"). Documentar no teste a divergência já conhecida: `SIGAJURI_Contencioso` **cria solicitação
  sem constar do catálogo `onlyCanStart`** — a permissão real diverge do filtro da tela, e isso é
  achado, não ruído.
- **Custo/viabilidade:** alcançável hoje, leitura pura, 2 GETs. Manutenção: a lista esperada precisa
  ser atualizada conscientemente a cada publicação — que é exatamente o objetivo.

### `CT-TSK-07-H` · "Somente salvar" — salvar sem movimentar

- **Prioridade: P2** — uma das quatro ações do menu de tarefa, e a única sem cobertura nenhuma.
- **Tipo:** Funcional.
- **Por que falta:** a suíte movimenta (Enviar) e nada mais. *Somente salvar* é a ação que o usuário
  real usa o dia inteiro para não perder trabalho. **Risco concreto:** o rascunho não persiste e o
  usuário perde o preenchimento de um formulário de SC de 20 campos — silenciosamente, porque a
  tela confirma o salvamento.
- **Pré-condições:** uma tarefa aberta do próprio usuário (a SC do próprio teste, em etapa dele).
- **Passos:** abrir a tarefa, alterar um campo com valor `QA` identificável, *Somente salvar*,
  **recarregar a página** e reabrir a tarefa.
- **Resultado esperado:** o valor persiste **e a etapa não mudou** (a solicitação segue na mesma
  atividade, com o mesmo responsável, confirmado por `/requests/<id>?expand=currentMovements`). As
  duas metades importam: salvar que movimenta é tão defeito quanto salvar que perde.
- **Custo/viabilidade:** alcançável hoje, `@destrutivo`.

### `CT-TSK-08-H` · Transferir atividade

- **Prioridade: P2** — a suíte tem duas specs que **listam** a aba Transferir
  (`gerencia-compras`, `atribuicao-comprador`) e nenhuma que transfere.
- **Tipo:** Funcional.
- **Por que falta:** a transferência é uma das quatro saídas de uma tarefa e o principal mecanismo
  de continuidade quando alguém sai de férias. **Risco concreto:** a tarefa transferida some para os
  dois lados — não aparece para o destinatário e some do remetente.
- **Pré-condições:** tarefa do próprio usuário com `currentMovto > 1` e sem `avoidTransfer` (é o que
  faz a opção aparecer); um usuário-destino válido, descoberto em execução.
- **Passos:** abrir a tarefa → *Transferir* → escolher o destino → confirmar → reler
  `/requests/<id>?expand=currentMovements`.
- **Resultado esperado:** a solicitação permanece **na mesma atividade** e o `assignee` passa a ser
  o destino. A confirmação vem do servidor.
- **Custo/viabilidade:** alcançável, `@destrutivo`, **mas com custo assimétrico**: depois de
  transferir, a conta da automação **perde a tarefa** e não consegue trazê-la de volta (a mensagem
  do servidor é *"Esta tarefa não está mais sob sua responsabilidade!"*). A solicitação continua
  cancelável pelo teardown, então o resíduo é gerenciável — mas o destino recebe lixo `QA` na caixa
  dele. **Recomendo combinar o usuário-destino com o dono do ambiente antes de implementar.**

### `CT-FAT-04-H` · Faturamento: retorno pela Correção e fila do Protheus

- **Prioridade: P2** — mesmo padrão do `CT-CMP-08-H`, na outra ponta: a suíte cria a medição e a
  roteia, e para aí.
- **Tipo:** Funcional.
- **Por que falta:** o BPMN do FatCon tem **117 Correção** e **182 Aguarda processamento Fila
  Protheus**, e nenhuma das duas tem oráculo. `CT-FAT-02-S3` (reprovação) está registrado como
  inalcançável porque o usuário não pertence aos grupos de validação — verdadeiro. Mas a etapa
  **182** é observável por leitura: dá para afirmar que a medição enviada **chega** à fila e sai
  dela. **Risco concreto:** a medição some entre o Fluig e o Protheus e ninguém sabe onde ela parou.
- **Pré-condições:** medição criada pelo teste (o `ciclo-faturamento.spec.js` já faz isso).
- **Passos:** após o envio da medição, acompanhar `/requests/<id>/tasks?pageSize=60` até a etapa 182
  aparecer, e afirmar sobre a transição dela (com espera por **condição**, nunca por tempo).
- **Resultado esperado:** a medição transita pela fila e sai dela para uma etapa seguinte dentro do
  orçamento de tempo do teste; se ficar presa, a falha nomeia a etapa e o tempo decorrido.
- **Custo/viabilidade:** alcançável em parte hoje (a etapa 182 é observável; a Correção exige que a
  medição seja reprovada, o que depende dos grupos de validação — **marcar como bloqueado**, igual
  a `CT-FAT-02-S3`). Implementar só a metade alcançável e declarar a outra.

### `CT-JUR-06-H` · Contencioso: nasce no pool certo?

- **Prioridade: P2** — a suíte **cria** processos de Contencioso (`@destrutivo`, é um dos 4
  processos em que a automação comprovadamente cria instância) e **não verifica onde eles param**.
- **Tipo:** Funcional.
- **Por que falta:** `CT-JUR-04-H` afirma sobre a tela de criação ("deveria criar e rotear a
  solicitação pela UF e Responsável"), não sobre o estado resultante no servidor. A skill mediu que
  a instância nasce em **"7-Resposta" (seq 7), no pool `GRUPO_GEJUR_9`**. **Risco concreto:** o
  roteamento por UF quebra, todo processo cai no mesmo grupo, e a suíte fica verde porque a tela
  disse "criado com sucesso" — exatamente o falso positivo do D-01, em outra área.
- **Pré-condições:** as mesmas do teste de Contencioso que já existe.
- **Passos:** após a criação, `GET /requests/<id>?expand=currentMovements` e
  `GET /requests/<id>/tasks?pageSize=60`.
- **Resultado esperado:** etapa `7-Resposta`, `assignee.code` = `Pool:Group:GRUPO_GEJUR_9`, e o
  grupo **corresponde à UF escolhida** no formulário (se houver mais de um grupo por UF, esta é a
  assertion que prova o roteamento).
- **Custo/viabilidade:** alcançável hoje — é **acréscimo de assertion** a um teste destrutivo que já
  roda, custo de massa **zero**. Um dos melhores custo/benefício da lista.

### `CT-SEG-10-S1` · ACL dos documentos que a SC cria sozinha no GED

- **Prioridade: P2** — o produto cria, por solicitação, uma cadeia de pastas e dois documentos por
  anexo. **Ninguém nunca olhou a permissão desses objetos.**
- **Tipo:** Segurança.
- **Por que falta:** o `securityPermissionVOs` é explícito no `saveNewItem` que a suíte usa nos
  testes de GED, mas os documentos criados pelo **workflow** não passam por ali. **Risco concreto:**
  anexo de SC — que pode conter proposta comercial, planilha de rateio, dado de fornecedor — nasce
  com permissão herdada permissiva e fica legível para toda a base. É o irmão do `CT-SEG-07-S1`, na
  camada do GED.
- **Pré-condições:** uma SC com anexo criada pelo teste (compartilha o setup de `CT-ACC-09-H`,
  criando a sua própria).
- **Passos:** localizar os dois documentos gerados; ler as permissões por
  `GET /api/public/2.0/documents/getDocument/<id>` e pelo dataset `document`; comparar com o
  esperado.
- **Resultado esperado:** os documentos e a pasta da solicitação **não** são legíveis por perfil
  genérico — a permissão é restrita aos participantes do processo. Se o critério do negócio ainda
  não estiver definido, **pergunte antes de codificar**: assertion frouxa aqui é pior que ausência
  de teste.
- **Custo/viabilidade:** a leitura é alcançável hoje. ⚠️ **O critério de aprovação não está
  definido** — este caso precisa de uma decisão da Cassi sobre qual é a ACL correta antes de virar
  teste. Entra na lista de "Perguntas em aberto para a Cassi" do README.

### `CT-FIN-01-H` · Rejeições de Pagamentos — uma área inteira sem cobertura

- **Prioridade: P2** — área de negócio publicada, ativa, iniciável pela conta, **zero linhas de
  teste e zero linhas de catálogo**.
- **Tipo:** Funcional.
- **Por que falta:** `bpm_financeiro_rejeicoes_bancarias` (categoria **Financeiro**) abre para
  `TOTVS-FS` (medido 26/08) e nunca foi iniciado por ninguém. Nenhuma das 26 famílias do catálogo de
  casos cobre Financeiro — a área simplesmente não existe no escopo de teste. **Risco concreto:**
  um processo que trata rejeição bancária vai para produção sem nenhuma verificação; e se ele não
  deveria estar publicado, ninguém percebe.
- **Pré-condições:** nenhuma para a abertura.
- **Passos:** abrir o formulário de início, inventariar os campos obrigatórios, e afirmar sobre a
  estrutura (mesmo padrão de `cadastro-fornecedor.spec.js` e `parecer-tecnico.spec.js`: abre,
  espelha os campos, **não** envia).
- **Resultado esperado:** o formulário monta com os campos do domínio. Se montar vazio, ou servir
  template de outro processo (como `wf_automacao_admissao` faz hoje), isso é o achado.
- **Custo/viabilidade:** alcançável hoje, leitura pura. ⚠️ Antes de investir no **ciclo** deste
  processo, confirme com a Cassi se ele está em escopo — nunca foi iniciado por ninguém, e pode ser
  publicação órfã. O caso de abertura é barato o bastante para valer de qualquer jeito.

### `CT-SUB-02-H` · Delegação de Tarefas (`wf_SubstituiçãoCargosFluig`)

- **Prioridade: P2** — está no catálogo `onlyCanStart`, abre, e **nunca foi iniciado**. Sem teste.
- **Tipo:** Funcional.
- **Por que falta:** a família `CT-SUB` do catálogo cobre *Substituição de Cargos*
  (`wf_substituicaocargos`, RH) — processo **diferente**, apesar do nome parecido. A *Delegação de
  Tarefas* é de categoria **Compras** e passou despercebida pela semelhança de nome. **Risco
  concreto:** o mecanismo de delegação é o que destrava o comprador (registrado na memória do
  projeto como peça do ciclo de Compras) e não tem nenhuma verificação.
- **Pré-condições:** nenhuma. ⚠️ **O `processId` tem cedilha e til** — precisa de `encodeURIComponent`
  na URL; sem isso o teste falha por 404 e parece defeito.
- **Passos:** abrir o formulário de início e afirmar sobre os campos (delegante, delegado, período).
- **Resultado esperado:** formulário monta com os campos de delegação. "Último iniciado: Nunca" é
  contexto, não critério.
- **Custo/viabilidade:** alcançável hoje, leitura pura.

---

# P3 — barato, ou de valor menor

### `CT-GED-04-S1` · Rejeitar documento — o caminho e o `msgId` que mente

- **Prioridade: P3** · **Tipo:** Funcional / Regressão.
- **Por que falta:** `CT-GED-04-H` cobre **aprovar**. Rejeitar não tem teste — e a skill mediu dois
  fatos que merecem guarda: a rejeição **destrói** o documento (não vai para a Lixeira, todas as
  rotas de leitura devolvem `NotFoundException`), e a resposta vem com
  `{"msgId":"Novo documento publicado: …"}` — **o `msgId` mente**. Risco: alguém "corrige" um teste
  futuro usando o `msgId` como oráculo e cria falso verde permanente.
- **Pré-condições:** documento publicado pelo teste em pasta com aprovação
  (`Compras e Contratação > Parecer Técnico`, id 343011), autodesignando-se aprovador.
- **Passos:** publicar → Central de Tarefas → *Documentos a aprovar* → **Rejeitar** com justificativa
  `QA` → confirmar o sumiço por rota de leitura.
- **Resultado esperado:** o documento deixa de existir (`NotFoundException`), **e não está na
  Lixeira**. Assertion explícita de que o oráculo é o estado do documento, com comentário no teste
  registrando que o `msgId` não serve.
- **Custo/viabilidade:** alcançável hoje, `@destrutivo`, e é a limpeza **perfeita** — rejeitar não
  deixa resíduo nenhum. ⚠️ Precisa do lock `fluig-upload-staging`. ⚠️ Abrir "Documentos a aprovar"
  **muda estado de sessão no servidor** (`setAttribute centralTaskType=toapprove`) e pode fazer a
  Central aterrissar noutra sub-aba depois — a pré-condição de outros testes tem de clicar na aba
  desejada.

### `CT-PLT-09-S1` · Fechar a matriz dos 9 bloqueios duros

- **Prioridade: P3** · **Tipo:** Segurança / Negativo.
- **Por que falta:** `inicio-processo-bloqueado.spec.js` cobre **2 dos 9** processos com bloqueio
  duro medido (`bpm_recepcao_documentos_fiscais_compras` e `wf_solicitacao_ferias`). Ficam de fora
  os outros 4 RDFC, `wf_aprovacao_ocorrencia` (coberto no spec de RH) e as **2 Súmulas**
  (`sumula`, `sumulas_analise_intervenientes`), que não aparecem em teste nenhum. Risco: a permissão
  de um deles afrouxa e ninguém percebe — a lista existe só na skill.
- **Passos:** estender a lista parametrizada existente; a mensagem esperada é literal e idêntica
  para todos: *"Usuário `<login>` não possui permissão para iniciar solicitações do processo `<id>`"*.
- **Resultado esperado:** os 9 bloqueiam, nenhum formulário monta, `guarda.tentativas() === 0`.
- **Custo/viabilidade:** alcançável hoje, leitura pura, **é quase só dados** — o Page Object e o
  padrão já existem. Melhor razão esforço/cobertura do documento.

### `CT-PLT-08-S1` · Processo inativo e resíduo de desenvolvimento visível

- **Prioridade: P3** · **Tipo:** Negativo / Higiene de ambiente.
- **Por que falta:** `testePRODUTO` está **inativo** e responde *"Erro — Este processo não está mais
  ativo!"*; o processo `teste` (categoria **ADMIN**) está no catálogo `onlyCanStart` e **abre para
  usuário comum**. Nenhum dos dois tem teste. Risco baixo em produção, mas é sujeira que sinaliza
  falta de governança de publicação — e o teste custa quase nada.
- **Resultado esperado:** `testePRODUTO` recusa com a mensagem de inativo; `teste` **não deveria
  constar** do catálogo de um usuário de Compras (vermelho intencional, com anotação de achado).
- **Custo/viabilidade:** alcançável hoje. Cobre bem junto com `CT-PLT-10-H`, que é o mesmo assunto
  numa camada acima.

### `CT-NOT-03-S1` · Contratos da API de notificação

- **Prioridade: P3** · **Tipo:** Integração (contrato) / Regressão.
- **Por que falta:** três defeitos de contrato medidos e sem guarda:
  `GET /notification/api/v1/notifications` **ignora `offset`/`limit`** (devolve a lista inteira,
  500+ itens); `DELETE /notifications/{id}` responde **500 `NotFoundException`** apesar de
  `canRemove:true`; a remoção real é `POST /globalalertapi/api/rest/alert/removeAlerts`. Risco: a
  paginação "voltar a funcionar" muda o comportamento de quem consome a lista inteira hoje, e
  ninguém tem oráculo dos dois lados.
- **Resultado esperado:** `limit=3` devolve 3 itens (hoje devolve tudo → vermelho intencional); e
  `removeAlerts` remove de verdade, confirmado por releitura.
- **Custo/viabilidade:** alcançável hoje. ⚠️ A remoção é escrita — `@destrutivo`, e só sobre
  notificações que a **própria execução** gerou.

### `CT-PLT-07-S1` · `addFavorites` duplicado responde 500 em texto puro

- **Prioridade: P3** · **Tipo:** Regressão de contrato.
- **Por que falta:** medido: favoritar duas vezes o mesmo processo devolve **500 com corpo em TEXTO
  PURO** (`Processo <id> já está nos seus favoritos.`), não JSON. Risco: qualquer cliente que faça
  parse cego quebra — e a suíte já tem um Page Object de favoritos que convive com isso sem
  documentá-lo em assertion.
- **Resultado esperado:** duplicidade deve responder erro de negócio **em JSON** (ou 200 idempotente),
  não 500 com texto. Vermelho intencional.
- **Custo/viabilidade:** alcançável, `@destrutivo` e reversível (`removeFavorites`). ⚠️ Favorito é
  **estado global de conta única** — a suíte já removeu um caso por isso (`describe.serial` não
  serializa entre repetições do `--repeat-each`). Este teste **precisa** do mesmo tipo de lock de
  `utils/exclusividade.js`, ou não deve ser escrito.

### `CT-CLI-03-H` · Questionário: estado pós-criação nunca verificado

- **Prioridade: P3** · **Tipo:** Funcional.
- **Por que falta:** mesmo padrão de `CT-JUR-06-H`: a suíte **cria** instância do questionário
  (é um dos 4 processos em que a automação comprovadamente cria) e nunca confere onde ela parou.
  Medido: nasce em **"Acompanhamento Status" (seq 5)**, com o **próprio solicitante** como
  responsável. Prioridade menor que a do Contencioso porque responder o questionário já é defeito
  conhecido (HTTP 500) e o fluxo não anda de qualquer forma.
- **Resultado esperado:** etapa 5, `assignee` = o solicitante, `status: OPEN`.
- **Custo/viabilidade:** acréscimo de assertion a um destrutivo existente, custo de massa zero.

### `CT-A11Y-01-S1` · Nenhum teste de acessibilidade na suíte

- **Prioridade: P3** — valor real, mas é a única proposta que exige dependência nova.
- **Tipo:** Funcional (acessibilidade).
- **Por que falta:** o README registra os **ícones sem nome acessível** da coluna "Ação" como
  *decisão técnica* (ancorados por `title`) e o mapa do ambiente traz "três ocorrências do mesmo
  problema, com recomendação consolidada ao time" — ou seja, o problema **foi diagnosticado e nunca
  virou teste**. Enquanto for só recomendação, cada tela nova repete o padrão. Risco concreto:
  obrigação legal de acessibilidade para operadora de saúde, e a suíte não tem nada a dizer.
- **Passos:** `@axe-core/playwright` sobre as telas-chave, com violações de severidade
  `serious`/`critical` como critério.
- **Resultado esperado:** zero violações `serious`/`critical`; a linha de base atual entra como
  lista nomeada e datada de exceções, para que só o **novo** reprove.
- **Custo/viabilidade:** exige `npm i -D @axe-core/playwright` — **dependência nova, precisa de
  aprovação** (a política da suíte é preferir o que o framework já resolve). E vai nascer muito
  vermelho: dimensione a linha de base antes de decidir.

---

# Bloqueado — não vender como implementável

### `CT-TSK-06-S1` · Cascata de cancelamento SC → Cotação

- **Prioridade:** seria P2 · **Tipo:** Integração.
- **Por que falta:** o desenvolvedor afirma que "cancelar a SC cancela o subprocesso", e a skill
  registra como **gatilho não confirmado** — o padrão observado (cotações 112013–112024 canceladas
  em lote junto de SCs, em 22/08) é compatível, mas a hipótese provável é que o cancelamento no
  **Protheus** derrube as cotações do mesmo `numSc`, e não o Fluig. É uma afirmação do fornecedor
  sem oráculo.
- **Por que está bloqueado:** exige uma SC **com cotação viva vinculada** pelo `hd_numSc`. Como
  toda SC criada pela automação fica presa pelo **D-01** e nunca chega ao Protheus, **nenhuma
  cotação nasce** — é a mesma causa dos `PRÉ-CONDIÇÃO AUSENTE` de `CT-COT` e `CT-NEG` já
  registrados. Cancelar uma cotação **pré-existente** para medir a cascata é escrita sobre massa de
  terceiros: **vetado**.
- **Quando destrava:** junto com o D-01. Deixe registrado como dependência do D-01, e não como
  backlog independente — senão alguém tenta e queima tempo.

---

# Observações que não viraram caso

Coisas reais, mas que são **decisão de escopo** e não lacuna a implementar sem conversa:

- **Um único navegador.** `playwright.config.js` roda só `devices['Desktop Chrome']`, nos dois
  projetos. Não há Firefox, WebKit nem viewport móvel. Para um portal interno isso pode ser decisão
  consciente — mas hoje ela não está escrita em lugar nenhum. **Recomendo registrá-la** no
  `README.md` como decisão, ou abrir a discussão. Ausência de decisão registrada envelhece pior que
  ausência de teste.
- **Nenhuma guarda de performance.** O D-03 (contrato de 177 itens congela o navegador) é
  conhecido, e `CT-ACC-03-S3` está registrado como lacuna por isso. Mas não há **nenhum** orçamento
  de tempo declarado como assertion em lugar nenhum da suíte — degradação gradual passa
  despercebida até virar timeout. Um limite de carga nas 3 telas mais pesadas seria barato; a
  oscilação do Protheus (855 contratos ↔ zero) tornaria o teste ruidoso, então **só vale depois** de
  existir o portão de pré-condição por execução já recomendado em `estado-do-gate.md`.
- **`wf_pagamento_horas_extras`**: a suíte cobre o **Portal de Autorização de Horas Extras**
  (widget, `CT-BH`) e não o **processo** de mesmo assunto, que abre para a conta. Não propus caso
  porque é provável que sejam a mesma funcionalidade por dois caminhos — **confirme com a Cassi**
  antes de investir.
- **`FLUIGADHOC` / `FLUIGADHOCPROCESS`** (Listar Tarefas / Executar Tarefa Ad Hoc): funcionalidade
  **nativa da plataforma**, não customização da Cassi. Ausência real de cobertura, mas testar
  produto de prateleira não é o melhor uso do orçamento deste regressivo. Registrado para não
  parecer esquecimento.

---

## Resumo executivo

**26 lacunas novas**, nenhuma delas repetindo os 30 casos já registrados em `docs/cobertura.md`.

- **5 são P1**, e **21 dos 26 são alcançáveis hoje** pela conta `TOTVS-FS`, sem nenhum
  provisionamento — o que contrasta com o backlog atual, cujo maior bloco depende de usuário de RH e
  credencial de fornecedor.
- **9 são leitura pura** (nem `@destrutivo` levam) e custam praticamente só tempo de escrita.
- **1 já nasce com defeito medido** (`CT-SEG-07-S1`), **1 depende de decisão da Cassi**
  (`CT-SEG-10-S1`, critério de ACL), **1 exige dependência nova** (`CT-A11Y-01-S1`), **1 pede
  combinação com o dono do ambiente** (`CT-TSK-08-H`, transferência irreversível) e **1 está
  honestamente bloqueado** (`CT-TSK-06-S1`, dependente do D-01).

**Os três de maior valor:**

1. **`CT-SEG-07-S1`** — não é lacuna de cobertura, é **defeito de segurança medido nesta
   investigação**: um usuário sem permissão de iniciar RDFC lê o formulário completo de instâncias
   fiscais alheias, com CNPJ e valores, por id sequencial. Custa 3 GETs.
2. **`CT-CMP-07-S1`** — o defeito mais severo do README (**SC criada de formulário vazio**) é o
   único da tabela **sem teste próprio**. Sem ele, a correção não tem como ser verificada.
3. **`CT-TSK-05-H`** — a suíte inteira depende do cancelamento para se limpar e **nunca o testou**.
   Não existe um único caso de cancelamento nos 163 do catálogo: é área faltando, não cenário.
