# Recomendações de testabilidade e acessibilidade

**O que é:** a lista dos pontos em que a suíte E2E precisou descer abaixo da prioridade de
locators recomendada (`getByRole` → `getByLabel` → … → CSS → XPath) porque a aplicação não
oferece âncora semântica. A `playwright-test-creator` manda, nesse caso, *"recomendar
`data-testid` ao time de desenvolvimento em vez de criar seletor frágil"* — este documento é
essa devolutiva, que o repositório nunca tinha emitido.

**Para quem:** cada grupo abaixo tem destinatário diferente — TOTVS (plataforma), time Fluig da
Cassi (formulários) e time Fluig da Cassi (widgets Angular/PO-UI). Não misture: o primeiro grupo
não é acionável pelo cliente.

**Data da medição:** 03/09/2026.
**Versão em que foi medido:** TOTVS Fluig **Voyager 2.0.0-260811** (`docs/mapa-do-ambiente.md:10`).
Seletor de plataforma é contrato implícito com a versão — ao atualizar, remeça o Grupo 1.

---

## 1 · Composição dos locators da suíte, hoje

Medido sobre os 42 arquivos de `pages/` + `components/`:

```bash
for p in getByRole getByLabel getByPlaceholder getByText getByTestId getByTitle; do \
  printf '%-18s %s\n' "$p" "$(grep -roE "$p\(" pages/ components/ | wc -l)"; done
printf '%-18s %s\n' 'locator(CSS)' "$(grep -roE '\.locator\(' pages/ components/ | wc -l)"
printf '%-18s %s\n' 'xpath='       "$(grep -ro  'xpath='       pages/ components/ | wc -l)"
```

| Prioridade da skill | Forma | Ocorrências |
|---|---|---|
| 1 | `getByRole` | **406** |
| 2 | `getByLabel` | 3 |
| 3 | `getByPlaceholder` | 4 |
| 4 | `getByText` | 39 |
| 5 | `getByTestId` | **0** — nenhum `data-testid` existe na aplicação |
| 6 | `locator(<CSS>)` | **144** (47 por `#id`, 26 por classe, 50 por atributo) |
| 6 | `getByTitle` (atributo `title` como gancho) | 3 |
| 7 | `xpath=` | 5 |

Leitura: a suíte está saudável no topo da pirâmide (406 de ~600 alcances por papel acessível) e
**não tem nenhum `getByTestId` porque não há `data-testid` para usar**. Os 144 CSS e os 5 XPath
são a dívida que este documento devolve ao time. Detalhamento por sub-recorte:
`grep -roE "locator\(\s*['\"\`][^'\"\`]*#" pages/ components/ | wc -l` (ids) e as variantes
`…\.` (classe) e `…\[` (atributo).

---

## 2 · Grupo 1 — Plataforma TOTVS (não alterável pelo cliente)

Recomendação global: **aceitar como CSS estável (prioridade 6)** e registrar a versão. Não vale
abrir chamado; vale remedir a cada atualização de release.

| Onde | Elemento | Como a suíte alcança hoje | Por que é frágil | Atributo recomendado | Ganho | Prioridade |
|---|---|---|---|---|---|---|
| Central de Tarefas | painéis de contagem | `.panel-task-chart-open/-pool/-documents/-requests/-agreement` — `pages/CentralTarefasPage.js:45-49` | classe de layout da plataforma; muda em redesign | `role="status"` + nome acessível | teste | baixa (TOTVS) |
| Central de Tarefas | cartão de solicitação | `task-card-component` — `pages/CentralTarefasPage.js:54` | custom element sem papel ARIA | `role="article"`/`aria-label` | a11y + teste | baixa (TOTVS) |
| GED · publicar documento | Descrição / Arquivo | `#ecm-documentPublisher-documentDesc`, `#inputFile` — `pages/DocumentosGedPage.js:89-90` | id da plataforma; sem `<label for>` acessível | `<label for>` | a11y + teste | baixa (TOTVS) |
| GED · lixeira | ícone Restaurar | `[title="Restaurar Documento"]` — `pages/DocumentosGedPage.js:571` | `title` não é nome acessível confiável | `aria-label` | a11y + teste | baixa (TOTVS) |
| Ações da tarefa | caret / menu de opções | `#dd-options`, `#optionList` — `pages/AcoesDaTarefaPage.js:48-49` | id da plataforma | já tem `aria-label`; manter | teste | baixa (TOTVS) |
| Ciclo do Comprador (form) | combo `select2` | `.select2-results__options li[role="option"]`, `…--highlighted` — `pages/CicloCompradorPage.js:437,441` | classe interna da lib select2 | — (lib de terceiro) | teste | baixa (TOTVS/lib) |
| Ciclo do Comprador (form) | autocomplete typeahead | `.tt-input` — `pages/CicloCompradorPage.js:456` | classe interna do twitter-typeahead | — (lib de terceiro) | teste | baixa (TOTVS/lib) |
| Todo formulário BPM | iframe do formulário | `iframe[title="Visualizador"]` — 20 `frameLocator` em `pages/` | `title` traduzido pelo locale | `name`/`id` estável no iframe | teste | baixa (TOTVS) |

---

## 3 · Grupo 2 — Formulários do cliente (ids já estáveis)

Os ids são bons e **devem ser mantidos** — a suíte depende deles e eles não mudam. O que falta é
um passo pequeno com ganho duplo: **`<label for="…">` em todo campo**. Com isso a suíte migra de
`locator('#id')` (prioridade 6) para `getByLabel` (prioridade 2) e o campo passa a ter nome
acessível de verdade, hoje inexistente.

| Onde | Elemento | Como a suíte alcança hoje | Por que é frágil | Atributo recomendado | Ganho | Prioridade |
|---|---|---|---|---|---|---|
| Rejeições de Pagamentos | Nº do processo | `input#WKNumProces` — `pages/FormularioRejeicoesPagamentosPage.js:68` | id sem label; ids repetidos herdados do RDFC (ver `@achado`) | `<label for>` + **id único no documento** | a11y + teste | **alta** |
| Rejeições de Pagamentos | E-mail do solicitante | `input#emailSolicitante` — `:70` | **casa 3 elementos** no documento (`:30`) — precisa de `input#` e de filtro por `div.has-feedback` | id único + `<label for>` | a11y + teste | **alta** |
| Rejeições de Pagamentos | Observação | `textarea#obsRejeicao` — `:76` | id sem label | `<label for>` | a11y + teste | média |
| Delegação de Tarefas | Data inicial / final | `input#substitutoDtInicial`, `#substitutoDtFinal` — `pages/DelegacaoTarefasPage.js:85-86` | id sem label; `type="date"` só aceita ISO | `<label for>` | a11y + teste | média |
| Delegação de Tarefas | Delegante / Delegado | `select#zoomColleague`, `#zoomColleague2` — `:83-84` | nome sem semântica ( `2` posicional) | `<label for>` + id descritivo | a11y + teste | média |
| Ciclo do Comprador · itens da SC | Data / Qtd / Preço / Obs. do item | `#tbprod_dtNecessidade___1`, `#tbprod_quantidade___1`, `#tbprod_precoUnitario___1`, `#tbprod_observacao___1` — `pages/CicloCompradorPage.js:214-221` | sufixo `___N` de tabela-pai/filho é convenção do Fluig, estável, mas sem label | `<label for>` por linha (ou `aria-label` com o nº do item) | a11y + teste | média |
| Questionário Clinicassi | Clínica / Unidade / Período | `#clinica`, `#unidade`, `#periodo_de`, `#periodo_ate` — `pages/QuestionarioClinicassiPage.js:43-46` | id sem label | `<label for>` | a11y + teste | média |
| Questionário Clinicassi | radios de avaliação | `input[type=radio][name^="mp_avaliacao___"]` — `:72,89` | agrupamento por prefixo de `name`, sem `<fieldset>/<legend>` | `<fieldset><legend>` + `<label for>` | a11y + teste | média |

---

## 4 · Grupo 3 — Widgets do cliente (Angular / PO-UI)

Aqui o problema não é só de teste: são controles que **um leitor de tela não anuncia** ou que
**o teclado não alcança**. É o grupo de maior prioridade.

| Onde | Elemento | Como a suíte alcança hoje | Por que é frágil | Atributo recomendado | Ganho | Prioridade |
|---|---|---|---|---|---|---|
| Acompanhamento de Contratos · coluna "Ação" | 3 ícones (Planilha, Solicitação de Compra, Informações) | `getByTitle('Planilha' \| 'Solicitação de Compra' \| 'Informações do Contrato')` — `pages/AcompanhamentoContratosPage.js:69-71` | âncoras **vazias, sem texto e sem `aria-label`**; `getByRole('link', {name})` não resolve. `title` é tooltip, não nome acessível | **`aria-label`** em cada `<a>` | **a11y** + teste | **alta** |
| Home · abas de categoria | RH Conecta / Gestão / Compras / Contratos | `tablist.getByText('…', { exact: true })` — `pages/HomePage.js:35-38` | `<a role="tab">` envolve `<div><li>` — **bloco dentro de inline, HTML inválido**; o Chromium calcula bounding box **0×0** e `getByRole('tab')` não alcança. Inalcançável por teclado e por leitor de tela | corrigir o HTML (`<li role="tab">` com conteúdo inline) | **a11y** + teste | **alta** |
| Preenchimento da SC (zooms) | qualquer campo com tooltip Bootstrap | espera `.tooltip-inner` sumir e, no pior caso, **clique por coordenada** `page.mouse.click` — `pages/PreenchimentoSolicitacaoCompraPage.js:38,43,108` | o tooltip **intercepta o clique** do usuário real, não só o do robô | `pointer-events: none` no `.tooltip` | **a11y (usabilidade real)** + teste | **alta** |
| Medição de Contrato (zooms) | campos com `data-toggle="tooltip"` | move o mouse para (0,0) e espera `div.tooltip` — `pages/MedicaoContratoPage.js:123` (motivo em `:95-117`) | em `selecionarCompetencia` o tooltip é disparado por **foco**, não por hover: permanece visível e intercepta | `pointer-events: none` no `.tooltip` | **a11y (usabilidade real)** + teste | **alta** |
| Ciclo do Comprador · grade PO-UI | toggle de detalhe da linha | `td.po-table-column-detail-toggle po-icon` — `pages/CicloCompradorPage.js:179` | `po-icon` sem nome acessível (`:175`); classe interna do PO-UI | `aria-label` no toggle (input do `po-table`) | a11y + teste | média |
| Preenchimento da SC | ícones de filtro dos zooms | `[id^="fluigfilter"][id$="_toggleTable"]` — `pages/PreenchimentoSolicitacaoCompraPage.js:102` | id gerado, casado por prefixo+sufixo e desambiguado por `.nth()` posicional | `data-testid` estável por zoom | teste | média |
| Login | seletor de idioma | `img[data-language="pt_BR"\|"es"\|"en_US"]` + clique por coordenada — `tests/e2e/auth/sessao.spec.js:41-54` | três `<img>` **sem `alt` e sem `aria-label`**; um overlay cobre o ícone, o clique normal não chega | `<button aria-label>` com o `<img alt>` dentro | **a11y** + teste | **alta** |
| Central de Tarefas de Compras / GED | linha ↔ botão da linha | 5 usos de `xpath=ancestor::…` — `pages/CentralTarefasComprasPage.js:158,330`, `pages/DocumentosGedPage.js:376,421,570` | prioridade 7: acopla à estrutura de DOM; qualquer wrapper novo quebra | `data-testid` na linha (ou `role="row"` + `aria-label` com o identificador) | teste | média |

**Onde não houver papel semântico natural** (custom elements, ícones-ação, cartões), o pedido é
`data-testid` — a suíte tem hoje **zero** deles e é o mecanismo que a `playwright-test-creator`
prevê exatamente para este caso.

---

## 5 · Achado cruzado — Voyager 2.0

O erro de console catalogado do Portal do Comprador (`CT-PLT-06-S1`,
`tests/e2e/plataforma/erros-de-console.spec.js:171-214`) é **404 em
`/style-guide/css/fluig-style-guide.min.css`**.

Isso não é um bug isolado da página. É o **sintoma número 2 da lista de breaking changes da
Voyager 2.0**, documentado em
`/home/dev1/tbc-knowledge-plugins/fluig/skills/fluig-master/references/voyager-2-migracao.md`
(skill `fluig:fluig-master`, fato 7: *"a 2.0 quebra front-end customizado — paths de CSS
retornam 404"*): esse caminho **deixou de existir** na 2.0; o path suportado passou a ser
`/style-guide/css/fluig-style-guide-flat.min.css`. Um artefato que ainda pede o caminho velho é
**front-end pré-Voyager rodando em plataforma 2.0** — e o efeito visível é o artefato ficar sem
estilo nenhum.

Recomendação ao cliente: revisar `wg_portalCompradores` — **e os demais widgets e formulários
customizados** — contra a lista completa de quebras da migração (paths de CSS, `CKEDITOR` →
Kendo UI, `fluigicon` → `animaliaicon`), antes que o próximo update quebre mais coisa. Os
estilos legados em `/style-guide/css/old/*` existem, mas a própria TOTVS os declara
**temporários e não recomendados** — servem para destravar, não como decisão de arquitetura.

---

## 6 · Procedência

Este documento **absorve** os três itens de acessibilidade que estavam em
`docs/mapa-do-ambiente.md:173-181`, agora com arquivo:linha e destinatário:

1. **Ícones da coluna "Ação"** (grade de contratos) → §4, linha 1.
2. **Seletor de idioma** (login) → §4, linha 7.
3. **Abas de categoria da Home** (`<a role="tab">` com `<div><li>`, bounding box 0×0) → §4, linha 2.

Todo número aqui vem do comando citado ao lado dele; nada foi transcrito de memória. Ao mudar a
release do Fluig, remeça o §1 e o Grupo 1.
