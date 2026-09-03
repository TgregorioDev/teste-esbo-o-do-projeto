# Política de escrita no ambiente

Este projeto testa uma **base de homologação da Cassi**, mantida para validar implementações.
Não é utilizada pelo cliente e não alimenta processo produtivo. O dono do ambiente autorizou,
em 24/08/2026, que a automação crie, movimente e aprove registros — é exatamente para isso que
a base existe.

O que se exige em troca é rastreabilidade e isolamento: escrever é esperado, escrever sem deixar
rastro não é.

## As quatro regras de escrita

**1. Todo registro criado nasce identificável.** Todo campo de texto livre que a automação
preenche carrega o prefixo `QA` e um sufixo único (`factories/*`, faker + `randomUUID`). Quem
olhar a base depois separa o que foi automação do que foi pessoa. Sem exceção.

**2. Cada teste cria a própria massa.** Não se reaproveita registro criado por outro teste, nem
se depende da ordem de execução — é o que mantém o paralelismo. Registro pré-existente
(contrato, fornecedor) continua sendo descoberto em tempo de execução, ver
`utils/massa-contratos.js`.

Contrato é a única exceção, e ela foi **medida** em 30/08/2026: não existe caminho pelo qual a
automação o crie (`docs/criacao-de-contrato-inviavel.md`). O que a suíte garante no lugar é que
**nenhum teste depende de um contrato específico** — a escolha é distribuída por hash entre os 554
vigentes da base e reservada por teste, então remover qualquer contrato afeta no máximo os testes
que o escolhiam.

**3. Cenário que escreve leva a tag `@destrutivo` — e roda na execução padrão.**

Isto mudou em 25/08/2026, por decisão do dono do ambiente: *"sempre rode tudo, não me importa se
serão testes destrutivos, a base de testes é pra isso"*. A tag continua servindo para mirar
(`--grep @destrutivo`) e para a regressão rápida de quem não quer gerar massa nova
(`PULAR_DESTRUTIVOS=1 npx playwright test`), mas o padrão passou a ser cobertura completa.

O motivo da mudança: excluir por precaução dava um número de cobertura otimista e escondia
defeito. Rodando os 34 destrutivos pela primeira vez, apareceu upload de `.exe` aceito sem
validação — um achado que a execução "segura" nunca teria produzido.

**4. Caso negativo continua provando que NÃO escreveu.** `utils/guarda-criacao.js` segue valendo
para os cenários de bloqueio — "o sistema não deve criar X quando falta campo obrigatório" só é
demonstrável afirmando que nenhuma requisição de criação saiu.

## O que continua bloqueando, mesmo com escrita liberada

Autorização resolve permissão de gravar. Não resolve **cadastro no ERP** nem **credencial de
terceiro**:

| Bloqueio | Afeta | Por quê |
|---|---|---|
| Cadastro na **AL/DHL** (aprovador de alçada) | Validação Orçamentária e Alçadas | etapa designada a aprovador nominal, não é pool — o usuário da automação não recebe a tarefa |
| Cadastro na **SY1** (comprador) | ciclo do comprador "de fato" | existe a delegação "Atuar como", que precisa ser verificada caso a caso |
| Credencial de **fornecedor externo** | Portal do Fornecedor autenticado | não há usuário fornecedor disponível |
| Perfil **administrador** | painel de datasets, scheduler, lista de admins | o usuário é não-admin, e isso é o comportamento correto |
| Grupos de **recepção fiscal** e **jurídico** | RDFC e SIGAJURI restritos | segregação por grupo — verificar processo a processo |

> **Verifique, não presuma.** O documento de casos afirmava que o usuário não inicia processos de
> RH; medimos e **cinco de seis abrem normalmente**. A mesma checagem vale para jurídico e
> recepção fiscal antes de declarar qualquer caso bloqueado.

## Onde o prefixo NÃO chega, e o que se faz no lugar

Medido em 26/08/2026, varrendo os 34 testes destrutivos:

| Fluxo | Carimbo |
|---|---|
| SC pelo modal do Portal e pelo formulário clássico | ✅ `Motivo da Solicitação`, `Justificativa para a Solicitação`, `Observação`, e o nome do anexo |
| GED (upload, aprovação, lixeira) | ✅ `Descrição` do documento e nome do nível de aprovação |
| Jurídico (Consultivo e Contencioso) | ✅ `Solicitação`, `Observações`, `Titulo Mensagem`, `Descrição` |
| Decisões de aprovação/reprovação | ✅ justificativa da etapa |
| **Medição de contrato** | ❌ **impossível** — ver abaixo |
| **Favoritar processo** | ❌ não há texto: favoritar é um clique |
| **Assumir tarefa do pool** | ❌ não há texto: transfere responsabilidade, não cria conteúdo |
| **Questionário CliniCASSI** | ❌ não há texto: só marca opções |

**A medição de contrato não tem onde ser carimbada.** O formulário na etapa "Início" tem **34
campos de texto e ZERO editáveis** — todos `readonly`/`disabled`, porque vêm de zoom do Protheus
ou de auto-preenchimento. O campo "Observações", que aceitaria a marca, só destrava em "Realizar
Medição do Contrato", etapa de quem consta como Fiscal/CSE do contrato no Protheus.

O substituto adotado é registrar **o que foi criado**: `CT-FAT-01-H` anota o número da medição e
anexa contrato, competência e planilha ao relatório. A trilha deixa de estar no dado e passa a
estar na execução — pior para varrer a base, mas é o que o produto permite.

> ⚠️ **Desvio conhecido, ainda não corrigido:** oito justificativas de decisão em
> `tests/e2e/portais/**` são montadas inline como `` `QA <caso> ${Date.now()}` `` em vez de virem
> de factory. Levam o prefixo, mas usam timestamp no lugar do UUID — dois testes disparando no
> mesmo milissegundo colidiriam — e furam a regra 2 desta política.

## Limpeza

Registro criado no Fluig/Protheus em geral não tem exclusão disponível — não há endpoint e a
regra de negócio proíbe apagar movimento. Por isso a rastreabilidade do item 1 é a garantia que
o projeto oferece: o resíduo é identificável para a rotina de higienização ou o reset de
ambiente que o time adotar. Cancelar solicitação, quando a interface permitir, é aceitável como
pós-condição — mas nunca é pré-requisito para o teste ser válido.
