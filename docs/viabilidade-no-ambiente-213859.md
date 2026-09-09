# Os casos bloqueados continuam bloqueados? — medido no `caixade213859`

Pergunta respondida aqui: **com este ambiente e este usuário, os casos que antes não eram
executáveis passaram a ser?**

Resposta curta: **não. E o saldo é negativo** — nenhuma das nove famílias de bloqueio caiu, e
38 chamados que a suíte já exercitava deixaram de ser executáveis aqui.

Medido em 09/09/2026, com Playwright MCP e sondas diretas, sobre os 518 casos de Fluig de
`Casos de Testes - SDCASSI/`.

---

## Como os 518 casos se distribuem por bloqueio declarado

| Bloqueio | Casos | Situação no `caixade213859` |
|---|---:|---|
| Matrícula de comprador no ERP | 167 | **continua** — e agora com um segundo impedimento |
| Credencial do Protheus | 112 | **continua** — está fora do Fluig |
| *(outros / não classificáveis por texto)* | 53 | caso a caso |
| Sem bloqueio declarado | 50 | a maior parte já virou teste |
| Credencial de fornecedor | 34 | **continua**, e piorou |
| Perfil de Fiscal/CSE | 32 | **continua** |
| Escrita em processo de terceiro | 20 | some o veto, some também a massa |
| Ciclo de aprovação completo | 15 | **continua** |
| Mais de um ambiente | 12 | **continua** — voltamos a ter um só |
| Perfil de administrador | 9 | **continua** |
| Massa inexistente | 8 | **piorou** |

---

## O que foi medido, bloqueio a bloqueio

### 1. Matrícula de comprador — 167 casos, o maior lote

`dsProtheus_getCompradores_restGetAll` continua respondendo com `error: "undefined"`, exatamente
como no ambiente anterior. A conta segue sem matrícula no ERP, e o Portal do Comprador mostra
"No data found" nas quatro filas.

**A novidade que muda a leitura — e não resolve.** Consultando `colleagueGroup`, `TOTVS-FS`
pertence a, entre outros:

```
G.P.Requisicao_de_Compras_Validacao_Compradores
G.P.Requisicao_de_Compras_Validacao_Alcadas
G.P.Requisicao_de_Compras_Gestor_Imediato
G.P.Requisicao_de_Compras_Validacao_Orcamentaria
G.P.Negociacao_Validacao_Propostas
G.P.Parecer_Tecnico_TI
```

Ou seja: **no Fluig, o perfil existe**. O que falta é a matrícula no ERP, que é o que o Portal
do Comprador resolve para montar a fila. Isso importa porque abre um caminho alternativo — o
**pool**: uma SC criada por nós chegaria a *Validação do Comprador* / *Validação do Gestor* como
tarefa de grupo, e a conta poderia assumi-la sem depender do Portal.

Só que esse caminho depende de **criar a SC**, e é aí que ele morre (item 2).

### 2. O formulário da Solicitação de Compras não abre — bloqueio NOVO

Abrir `pageworkflowview?processID=wf_solicitacao_compras` renderiza, dentro do iframe:

> **"Não foi possível estabelecer comunicação com o ERP. Por favor verifique os serviços de API
> e tente novamente."**

Nenhum dataset chega a ser chamado, nenhuma resposta HTTP ≥ 400 aparece na rede — a falha é da
chamada que o próprio script do formulário faz ao ERP. O overlay nunca sai e nenhum campo é
montado.

**Consequência:** todo cenário que cria SC — e são muitos, incluindo os que já rodavam — fica
fora. É o bloqueio de maior alcance deste ambiente, e não existia no anterior.

A mesma mensagem aparece em **Gestão de Equipes** e no **Portal de Autorização de Horas Extras**
(*"base offline"*). Já `dsProtheus_getBranches_restGetAll` (71 filiais),
`dsProtheus_getProdutos_restGetAll` (3.100) e `ds_protheus_getFuncionarios_restGetAll` (72.369)
respondem normalmente: a integração com o Protheus está **parcial**, não caída.

### 3. Credencial do Protheus — 112 casos

Inalterado, e inalterável por este caminho: são verificações no ERP (lançamento contábil, saldo
de parcela, `A2_CGC`, `CNTA300`). Não há superfície no Fluig para elas.

### 4. Credencial de fornecedor — 34 casos

Continua não havendo credencial. E o ambiente acrescentou dois impedimentos próprios: o
**reCAPTCHA da entrada recusa o domínio** e a **tela de redefinição de senha renderiza vazia**
(ela chama o `cassi_rest`, que não está publicado aqui). Mesmo com uma credencial real em mãos,
o login não se completaria.

### 5. Perfil de Fiscal/CSE — 32 casos

`TOTVS-FS` tem **6 tarefas**, todas em *Acompanhamento Status*. Nenhuma em *Realizar Medição do
Contrato*.

⚠️ Cuidado com uma leitura enganosa: `GET /process-management/api/v2/tasks` devolve **76** tarefas
em *Realizar Medição do Contrato*, o que parece indicar que a conta é fiscal. Não é — esse
endpoint lista tarefas de terceiros (o responsável delas é outra pessoa). Filtrando pelo
`assignee` do usuário autenticado, sobram as 6 acima. Foi um engano meu na primeira leitura, e
fica registrado para ninguém repetir.

Além disso não há contrato: `dsProtheus_getContratos_restGetAll` devolve zero linhas e o zoom de
Fornecedor do Faturamento abre vazio. Sem contrato não há medição de que ser fiscal.

### 6. Escrita em processo de terceiro — 20 casos

Aqui o veto era de política (não mexer em processo alheio). Nesta base **não há processo de
terceiro** — o que remove o veto e, no mesmo movimento, remove a massa. Efeito líquido: seguem
não executáveis.

### 7. Ciclo de aprovação completo — 15 casos

Depende de criar SC e movimentá-la pelas etapas. Bloqueado pelo item 2.

### 8. Mais de um ambiente — 12 casos

Estes casos (o FSWTBC-4453 à frente) existem para comparar DES × TST. Durante a transição houve
dois ambientes acessíveis e eles chegaram a ser executáveis; com a decisão de manter **somente o
`caixade213859`**, voltam a ficar bloqueados.

**É o único lote cujo destravamento não depende de ninguém no Protheus:** basta manter o acesso
de leitura ao segundo ambiente. Fica como decisão sua.

### 9. Perfil de administrador — 9 casos

`/portal/p/1/adminusers`, `/admingroups`, `/pageadmin` e `/adminprocess` respondem **Error
page**. A conta não administra nada aqui.

---

## O custo da troca, em número

Dos **50 chamados citados em título de teste**, medidos na execução completa deste ambiente:

| | |
|---|---:|
| Ainda executam (verde ou vermelho real) | **12** |
| Caíram para `PRÉ-CONDIÇÃO AUSENTE` | **38** |

Os 38 incluem trabalho que estava fechado e verde no ambiente anterior — toda a família de
Acompanhamento de Contratos (4068, 4073, 4076, 4078, 4820, 4982, 4983, 4986, 4987, 5233), a de
criação e integração da SC (621, 622, 2022, 4156, 4229, 4459, 4639, 4828, 4952), a de rateio
(1906, 1954, 4941), o Tracker de faturamento (1934, 2158, 4804) e o cancelamento pela Central
(4581).

Não é regressão da suíte: os testes continuam corretos e dizem, cada um, por que não puderam
rodar. É **perda de cobertura efetiva** causada pela troca de base.

---

## O que destravaria mais, por ordem de retorno

1. **Restabelecer a integração do ERP para o formulário da SC.** Sozinha, devolve a família de
   criação/integração e — combinada com os grupos que a conta já tem — abre pela primeira vez o
   caminho de **pool** para Gestor Imediato, Validação de Alçadas e Validação de Compradores,
   que nunca foi exercitável.
2. **Publicar o portal de Acompanhamento de Contratos** e ter contrato na base. Devolve 54
   testes e a massa de que o Faturamento depende.
3. **Manter o acesso de leitura ao segundo ambiente.** Destrava os 12 casos de comparação sem
   depender de ninguém.
4. **Matrícula de comprador no ERP para `TOTVS-FS`.** É o que falta para o Portal do Comprador
   montar as filas — 167 casos dependem disso, embora nem todos só disso.
