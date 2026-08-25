# Estado do quality gate — medições

Números **medidos**, não estimados. Relatório JSON do Playwright, ambiente real.
Última atualização: 25/08/2026, ao fim das três ondas de implementação.

## Suíte

| | |
|---|---|
| Specs | 65 |
| Testes | 167 |
| Page Objects | 36 |
| Linhas de código | ~14.600 |

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
