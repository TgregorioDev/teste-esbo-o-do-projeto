# Estado do quality gate — medições

Números **medidos**, não estimados. Relatório JSON do Playwright, ambiente real.
Última atualização: 25/08/2026, após a rodada de implementação com escrita autorizada.

## Suíte

| | |
|---|---|
| Specs | 55 |
| Testes | 146 (124 na execução padrão; 22 marcados `@destrutivo`) |
| Page Objects | 33 |
| Linhas de código | ~12.700 |

## Execução padrão (sem `@destrutivo`)

`npx playwright test --workers=4` · 124 testes · 6,8 min

| | |
|---|---|
| Esperados (verdes) | **97** |
| Inesperados (vermelhos) | **27** |
| Flaky | **0** |

Os 27 vermelhos são testes escritos contra o comportamento esperado que o produto não entrega,
mais alguns que declaram pré-condição ausente do ambiente. Nenhum é quebra da suíte.

## Correções feitas na consolidação

**A trava de escrita tinha um buraco.** `utils/guarda-criacao.js` interceptava só
`**/process-management/**`. Os formulários avulsos enviam por `POST /ecm/api/rest/ecm/workflowView/send`,
que passava direto — o que causou a criação acidental de um processo e, pior, fazia
`expect(guarda.tentativas()).toBe(0)` passar **sem provar nada** em vários testes.

A lógica foi invertida: bloqueia toda escrita no host, **exceto** uma lista explícita de rotas que
usam método de escrita mas são leitura (execução de dataset, fragmentos de renderização do portal,
autenticação de sessão do Portal do Fornecedor). Endpoint novo é bloqueado e o teste falha alto —
o oposto do falso verde.

Um falso verde real foi encontrado e corrigido por essa mudança: o teste de planilha de rateio
inválida afirmava "nada foi criado" enquanto o upload saía por um endpoint que a guarda não via.

**Dois escopos de guarda, com nomes honestos.** Nem todo teste negativo pode ser "escrita zero":
há casos cuja própria ação sob teste é uma escrita (subir planilha inválida). Bloqueá-la faria o
teste provar que a guarda interceptou, não que o produto rejeita. Daí:

- `bloquearEscritaNoAmbiente` — nenhuma escrita sai;
- `bloquearCriacaoDeProcesso` — a ação acontece, mas nenhuma solicitação nasce dela.

**Dois bugs em Page Object compartilhado**, encontrados por um agente no código de outro:
corrida entre marcar o rádio de decisão e clicar em Enviar (o Fluig recusava por campo
obrigatório), e um regex que devolvia texto de consenso como se fosse o nome da atividade.

**Uma violação de regra da skill:** `faker` chamado direto numa spec. Movido para factory —
massa tem um dono só.

## Determinismo

Cada suíte foi verificada com `--repeat-each=3` pelo agente que a escreveu. A execução conjunta
acima reporta **flaky: 0**. O `--repeat-each=3` sobre as 55 specs juntas ainda não foi rodado —
é o único item de verificação pendente, e depende de uma janela em que o ambiente não oscile
(ele caiu duas vezes em 24/08).

## Alerta de ambiente

O Portal de Acompanhamento de Contratos oscilou, no mesmo dia, entre 840 contratos, zero
contratos e não carregar. Para o usuário final isso é indisponibilidade intermitente do fluxo de
abertura de Solicitação de Compra a partir de contrato. Merece chamado próprio.
