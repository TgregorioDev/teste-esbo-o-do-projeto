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

**3. Cenário que escreve leva a tag `@destrutivo`.** Fica fora da execução padrão (`grepInvert`
no config) e roda sob demanda:

```bash
INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo
```

O motivo é higiene de suíte: quem roda a regressão do dia a dia não precisa gerar solicitação
nova a cada execução; quem quer exercitar o ciclo completo pede por isso explicitamente.

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

## Limpeza

Registro criado no Fluig/Protheus em geral não tem exclusão disponível — não há endpoint e a
regra de negócio proíbe apagar movimento. Por isso a rastreabilidade do item 1 é a garantia que
o projeto oferece: o resíduo é identificável para a rotina de higienização ou o reset de
ambiente que o time adotar. Cancelar solicitação, quando a interface permitir, é aceitável como
pós-condição — mas nunca é pré-requisito para o teste ser válido.
