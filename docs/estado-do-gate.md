# Estado do quality gate — medições

Números **medidos**, não estimados. Relatório JSON do Playwright, ambiente real.
Última atualização: 25/08/2026, ao fim das três ondas de implementação.

## Suíte

| | |
|---|---|
| Specs | 65 |
| Testes na execução padrão | 143 (57 arquivos) |
| Testes `@destrutivo`, sob demanda | 33 (16 arquivos) |
| **Total** | **176** |
| Page Objects | 36 |

Conferir os totais:

```bash
npx playwright test --list | tail -1                                    # 143
INCLUIR_DESTRUTIVOS=1 npx playwright test --grep @destrutivo --list | tail -1   # 33
```

## Determinismo — CERTIFICADO do lado do teste

Estudo dedicado, **735 execuções** em `--repeat-each=3 --workers=4`, fatiado por bloco e sempre em
primeiro plano.

**Resultado: em ambiente saudável, todo verde é 3/3 e todo vermelho é 3/3.** Nenhum teste é flaky.

O estudo encontrou e corrigiu **um falso verde real**: `CT-ADM-01-H` reprovava isolado mas passava
1 em 3 no conjunto — e o verde é que era falso, num teste que documenta defeito. Causa raiz: o
iframe do formulário navega quatro vezes durante a carga, e `not.toBeVisible()` é satisfeito no
primeiro poll em que o elemento não está lá; um poll caindo numa janela em branco passava sem
observar nada. Corrigido esperando o conteúdo estabilizar. Na verificação, descobriu-se ainda que
o heading usa `U+00A0` em todos os espaços — comparar com literal digitado teria criado um falso
verde permanente.

Também **refutou com medição** quatro hipóteses antes de atribuir 12 falhas ao ambiente: corrida
no carregamento (12/12 cargas limpas), concorrência (24/24 a 8 contextos), invalidação de sessão
por re-login e sessão fria (9/9). E confirmou que **não há vazamento de estado entre suítes** — o
teardown adotado está segurando.

## Duas fontes de vermelho variável que NÃO são flakiness da suíte

**1. Oscilação do Protheus.** O ambiente alterna entre ~855 contratos e resposta vazia. A suíte
rotula corretamente como `PRÉ-CONDIÇÃO AUSENTE`, mas o Playwright conta como falha — então um
relatório isolado ainda não se autoexplica. Na última execução conjunta, **29 dos 54 vermelhos
eram exatamente isto**.

**2. Não-determinismo no produto** (`wf_substituicaocargos`): em 8 cargas sequenciais, sem
concorrência e sem interceptação, o dataset devolveu a mesma resposta nas 8 e **7 bloquearam o
formulário, 1 não**. A suíte está certa em reprovar quando ocorre; estabilizar o teste esconderia
o defeito.

## O que falta para carimbar o gate

Uma **medição conjunta numa janela em que o Protheus não oscile**. Todas as tentativas de 24 e
25/08 pegaram o ambiente instável — ele caiu duas vezes e, na última verificação, respondeu 0 de 4.
Não é pendência de código.

## Recomendações de configuração

1. ✅ **Aplicado**: `actionTimeout` explícito (45s). Antes, `locator.waitFor()` usava o default de
   30s do Playwright, que não derivava de nada declarado — era o prazo mais apertado da suíte e
   ninguém o havia escolhido.
2. **Pendente**: `CT-FAT-02-S2` roda até 182s e às vezes estoura o próprio `test.setTimeout`,
   prendendo um worker por 3 minutos. Candidato a projeto isolado.
3. **Pendente**: portão de pré-condição por execução — as ~34 specs dependentes da grade poderiam
   checar uma vez, no início, se o Protheus responde, e reportar a janela de ambiente como bloco
   em vez de dezenas de vermelhos que parecem flaky.
4. **Pendente**: `test-results/`, `playwright-report/` e o `storageState` por execução, quando
   houver runs concorrentes no mesmo diretório.

## Alerta de ambiente

O Portal de Acompanhamento de Contratos oscilou, em dois dias seguidos, entre 855 contratos, zero
contratos e não carregar. Para o usuário final é indisponibilidade intermitente do fluxo de
abertura de Solicitação de Compra a partir de contrato. Merece chamado próprio, independente da
suíte.

## Medição final — 25/08/2026, 11:00–11:45

Suíte padrão completa (`@destrutivo` fora), fatiada por área, `--workers=4`, sempre em primeiro
plano. As cinco fatias somam exatamente os 143 testes da execução padrão.

| Fatia | Verde | Vermelho |
|---|---|---|
| `tests/api` + `auth` + `plataforma` + `seguranca` | 20 | 9 |
| `acompanhamento-contratos` + `contratos` | 28 | 12 |
| `compras` + `tarefas` | 17 | 7 |
| `documentos` + `fiscal` + `juridico` + `notificacoes` | 12 | 2 |
| `portais` + `rh` + `saude` | 26 | 10 |
| **Total** | **103** | **40** |

### Os 40 vermelhos, classificados

| Classe | Qtde | Natureza |
|---|---|---|
| **Defeito do produto**, já catalogado no README | 35 | vermelho intencional: o teste afirma o comportamento esperado e o produto não entrega |
| **`PRÉ-CONDIÇÃO AUSENTE`** — massa que não existe na base | 3 | `CT-FAT-02-S2` (nenhuma competência bloqueada), `CT-COT` e `CT-NEG` (nenhuma cotação — consequência de D-01) |
| **Sem veredito** | 1 | envio sem anexo — ver abaixo |
| **Não reproduzido** | 1 | `CT-DEL-01-H` — ver abaixo |

### O vermelho sem veredito

`ciclo-solicitacao-compras.spec.js › deve bloquear o envio quando nenhum anexo é informado`
reprova **de propósito**, mas mudou o *modo* de reprovar. O teste está escrito contra três
desfechos possíveis (diálogo de erro, diálogo de atenção, tela de sucesso) e hoje **nenhum
dos três aparece** — o Enviar sem anexo não produz retorno nenhum. Foi confirmado
determinístico (3/3 em repetição isolada), então não é flakiness.

O que impediu fechar o diagnóstico: **o ambiente degradou às ~11:30**, no meio da apuração.
Testes vizinhos do mesmo arquivo que estavam verdes às 11:05 passaram a estourar
`locator.click: Timeout 45000ms`. Enquanto o Protheus oscila, não é possível separar "o produto
mudou de comportamento" de "a tela não terminou de montar". **Fica aberto para remedir em janela
estável** — a assertion não deve ser reescrita antes disso, sob pena de codificar instabilidade
de ambiente como se fosse regra de produto.

### Um vermelho não reproduzido

`CT-DEL-01-H` (delegação de fiscais) reprovou uma vez sob `--workers=4` e **passou nas duas
repetições seguintes**, isolado e em paralelo. Na mesma leva havia um
`net::ERR_NETWORK_CHANGED`, o que aponta para a rede da máquina, não para a suíte. Registrado
como **não reproduzido**, não como resolvido.

### A instabilidade do ambiente, medida

Isto não é ruído de fundo — é o principal fator que limita o gate. Em ~45 minutos:

| Hora | Estado |
|---|---|
| 10:59 | grade de contratos sem registros |
| 11:05 | sem registros |
| 11:10 | estável (3 amostras seguidas com dados) |
| 11:05–11:25 | janela boa: as cinco fatias mediram normalmente |
| ~11:30 | degradou: `locator.click` estoura em telas que respondiam 25 min antes |
| 11:37 | fatias que não dependem do Protheus (jurídico, documentos) continuam rápidas e verdes |

O padrão é consistente: **o que depende da integração com o Protheus oscila; o que não depende,
não.** Por isso a suíte falha com `PRÉ-CONDIÇÃO AUSENTE` explícito em vez de timeout opaco —
é o que permite ler o relatório e separar ambiente de defeito sem abrir trace.
