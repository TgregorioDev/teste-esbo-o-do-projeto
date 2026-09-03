# Cobertura por caso de teste

> Gerado por `node scripts/gerar-cobertura.mjs`. **Não edite à mão** — regenere.

Medido sobre `docs/catalogo-casos.md` e `tests/**/*.spec.js`. A ligação é o **ID declarado
pelo teste** — no título de `test(...)`/`test.describe(...)` ou no cabeçalho do arquivo (antes
do primeiro `test`). É o que torna esta contagem auditável em vez de declarada. Desde
**03/09/2026**, menção em prosa (comentário, mensagem de assertion) **não conta como cobertura**.

| | |
|---|---|
| Casos no catálogo | **196** |
| Com teste na suíte | **154** (79%) |
| Sem teste | **42** |

O script falha se um teste citar um ID que não existe no catálogo, ou se um caso ficar sem teste
e sem motivo declarado. As duas checagens existem para que a matriz não possa envelhecer em
silêncio.

> ℹ️ **Mencionados só em prosa (NÃO contam como cobertura)**: `CT-DEP-01-H`, `CT-SUB-01-H`.
> Aparecem em comentário ou mensagem de assertion, em nenhum título de teste e em nenhum cabeçalho de arquivo. A listagem é informativa, para auditoria: ou o ID sobe para o título do teste que o exercita, ou o caso é lacuna com motivo declarado.

**⬜ não significa "esquecido"** — cada linha vazia traz o motivo medido. E **✅ não significa
sempre "fluxo executado"**: parte dos casos está coberta como *bloqueio documentado* — o teste
prova que o processo não abre, ou abre e o formulário não monta campo. Esses ficam prontos para
exercitar o fluxo no dia em que a pré-condição existir.

| ID | Caso | | Spec / motivo |
|---|---|---|---|
| `CT-ACC-01-H` | Acesso ao portal por usuário autorizado | ✅ | `e2e/acompanhamento-contratos/acesso-portal.spec.js` |
| `CT-ACC-01-S1` | Acesso negado a usuário fora dos grupos | ✅ | `e2e/acompanhamento-contratos/acesso-portal.spec.js` |
| `CT-ACC-01-S2` | Falha ao validar a permissão (dataset `colleagueGroup` indisponível) | ✅ | `e2e/acompanhamento-contratos/acesso-portal.spec.js` |
| `CT-ACC-02-H` | Ações disponíveis na linha do contrato | ✅ | `e2e/acompanhamento-contratos/grade-contratos.spec.js` |
| `CT-ACC-02-S1` | Status do contrato exibido de forma legível | ✅ | `e2e/acompanhamento-contratos/grade-contratos.spec.js` |
| `CT-ACC-03-H` | Abrir o modal de SC a partir do contrato ⭐ **caso-âncora do pedido do dev** | ✅ | `e2e/acompanhamento-contratos/modal-solicitacao-compra.spec.js` |
| `CT-ACC-03-S1` | Filial do contrato não encontrada | ⬜ | exige contrato com filial órfã (código sem cadastro); não existe na base |
| `CT-ACC-03-S2` | Protheus indisponível ao abrir a SC | ✅ | `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js` |
| `CT-ACC-03-S3` | Contrato volumoso (177 itens) | ⬜ | contrato de 177 itens congela o navegador (D-03) e derruba o worker |
| `CT-ACC-04-S1` | Confirmar com campos obrigatórios vazios | ✅ | `e2e/acompanhamento-contratos/validacoes-solicitacao.spec.js` |
| `CT-ACC-04-S2` | Contrato sem itens elegíveis | ✅ | `e2e/acompanhamento-contratos/indisponibilidade-protheus.spec.js` |
| `CT-ACC-04-S3` | Duplo clique em Confirmar não duplica a SC | ✅ | `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-ACC-04-S4` | Dois contratos abertos em sequência rápida | ✅ | `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js` |
| `CT-ACC-04-S5` | Número do contrato alterado à mão no modal 🔎 | ✅ | `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-ACC-04-S6` | Bypass da validação de cliente | ✅ | `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` · `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js` |
| `CT-ACC-05-H` | Confirmar cria a SC e ela chega ao solicitante ⭐ **caso-âncora do pedido do dev** | ✅ | `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js` |
| `CT-ACC-05-S1` | Falha na transferência deixa a SC com a conta de integração ⚠️ | ✅ | `e2e/acompanhamento-contratos/erros-no-start.spec.js` |
| `CT-ACC-05-S2` | Erro no start do processo | ✅ | `e2e/acompanhamento-contratos/erros-no-start.spec.js` |
| `CT-ACC-06-S1` | Itens zerados são descartados silenciosamente 🔎 | ✅ | `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js` · `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-ACC-06-S2` | Contrato de serviço sem quantidade | ✅ | `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js` |
| `CT-ACC-07-S1` | Valores fixos no payload da SC 🔎 | ✅ | `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-ACC-08-H` | Rastreabilidade contrato ↔ SC | ⬜ | depende de abrir a SC já criada — D-01 a deixa atribuída a `consumerkeycompras`, fora do alcance da conta da automação |
| `CT-ACC-08-S1` | Máscara monetária não corrompe os valores | ✅ | `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-ACC-08-S2` | Rateio do contrato chega íntegro na SC | ✅ | `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-ACC-09-H` | O caminho FELIZ do anexo da SC nunca foi provado | ✅ | `e2e/compras/ciclo-solicitacao-compras.spec.js` |
| `CT-ADM-01-H` | Admissão integra novo funcionário (feliz) | ✅ | `e2e/rh/admissao.spec.js` |
| `CT-ADM-01-S1` | Dados obrigatórios ausentes | ✅ | `e2e/rh/admissao.spec.js` |
| `CT-ADM-01-S2` | Reprocessamento após falha | ⬜ | reprocessar atividade de integração exige perfil de administrador |
| `CT-AUT-01-H` | Login com credenciais válidas | ✅ | `e2e/auth/login.spec.js` |
| `CT-AUT-02-S1` | Login com senha incorreta | ✅ | `e2e/auth/login.spec.js` |
| `CT-AUT-02-S2` | Login com usuário inexistente | ✅ | `e2e/auth/login.spec.js` |
| `CT-AUT-02-S3` | Campos obrigatórios vazios | ✅ | `e2e/auth/login.spec.js` |
| `CT-AUT-03-H` | Recuperação de senha — envio de token | ✅ | `e2e/auth/recuperacao-senha.spec.js` |
| `CT-AUT-03-S1` | Recuperação com e-mail vazio | ✅ | `e2e/auth/recuperacao-senha.spec.js` |
| `CT-AUT-03-S2` | Redefinição com token expirado/ inválido | ✅ | `e2e/auth/recuperacao-senha.spec.js` |
| `CT-AUT-03-S3` | Nova senha ≠ confirmação | ⬜ | exige token válido de redefinição, entregue por e-mail; sem caixa postal acessível |
| `CT-AUT-03-S4` | Nova senha fora da política | ⬜ | idem CT-AUT-03-S3 — depende do token por e-mail |
| `CT-AUT-04-H` | Troca de idioma na tela de login | ✅ | `e2e/auth/sessao.spec.js` |
| `CT-AUT-05-S1` | Expiração/timeout de sessão | ✅ | `e2e/auth/sessao.spec.js` |
| `CT-AUT-06-S1` | Logout invalida a sessão | ✅ | `e2e/auth/sessao.spec.js` |
| `CT-BH-01-H` | Portal carrega e autoriza horas extras (feliz) | ✅ | `e2e/rh/banco-horas.spec.js` |
| `CT-BH-01-S1` | Parâmetros de servidor ausentes  ⚠️ defeito conhecido (U-02) | ✅ | `e2e/rh/banco-horas.spec.js` |
| `CT-BH-01-S2` | Autorizar horas acima do limite | ✅ | `e2e/rh/banco-horas-limite.spec.js` · `e2e/rh/banco-horas.spec.js` |
| `CT-CLI-01-H` | Iniciar e responder o questionário (feliz) | ✅ | `e2e/saude/questionario-clinicassi.spec.js` |
| `CT-CLI-01-S1` | Fora da janela / periodicidade não cumprida | ✅ | `e2e/saude/questionario-clinicassi.spec.js` |
| `CT-CLI-01-S2` | Questionário incompleto | ✅ | `e2e/saude/questionario-clinicassi.spec.js` |
| `CT-CLI-02-S1` | Job de início parado  ⚠️ (U-14) | ✅ | `e2e/saude/questionario-clinicassi.spec.js` |
| `CT-CLI-03-H` | Questionário: estado pós-criação nunca verificado | ✅ | `e2e/saude/questionario-clinicassi.spec.js` |
| `CT-CMP-01-H` | Abertura completa e envio (caminho feliz) | ✅ | `e2e/compras/abertura-solicitacao-compras.spec.js` · `e2e/compras/ciclo-solicitacao-compras.spec.js` |
| `CT-CMP-02-S1` | Envio com campos obrigatórios vazios | ✅ | `e2e/compras/fail-open-formulario-sc.spec.js` · `e2e/compras/validacoes-solicitacao-compras.spec.js` |
| `CT-CMP-02-S2` | Rateio diferente de 100% | ✅ | `e2e/compras/validacoes-solicitacao-compras.spec.js` |
| `CT-CMP-02-S3` | Upload de planilha de rateio inválida | ✅ | `e2e/compras/ciclo-solicitacao-compras.spec.js` |
| `CT-CMP-02-S4` | Anexo obrigatório ausente | ✅ | `e2e/compras/ciclo-solicitacao-compras.spec.js` · `e2e/compras/fail-open-formulario-sc.spec.js` |
| `CT-CMP-03-S1` | Protheus indisponível ao carregar combos  ⭐ teste-mestre | ✅ | `e2e/compras/ciclo-solicitacao-compras.spec.js` |
| `CT-CMP-04-H` | Aprovação — Gestor Imediato (feliz) | ✅ | `e2e/compras/aprovacoes-solicitacao-compras.spec.js` |
| `CT-CMP-04-S1` | Reprovação do Gestor gera correção | ✅ | `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` · `e2e/compras/aprovacoes-solicitacao-compras.spec.js` |
| `CT-CMP-05-H` | Validação Orçamentária dentro da alçada | ✅ | `e2e/compras/aprovacoes-solicitacao-compras.spec.js` |
| `CT-CMP-05-S1` | Valor acima da alçada sem aprovador | ✅ | `e2e/compras/aprovacoes-solicitacao-compras.spec.js` |
| `CT-CMP-05-S2` | Alçada — payload de aprovação alterado no cliente é rejeitado pelo servidor | ⬜ | trava de alçada contra manipulação client-side: `TOTVS-FS` não está na AL/DHL do Protheus, então nenhuma tarefa de alçada chega à automação — e nenhuma SC dela chega à alçada (D-01). Declarado, não implementado; provisionamento compete ao cliente. Ler junto com CT-SEG-07-S1. |
| `CT-CMP-06-H` | Aprovação final (Compradores/Alçadas) e conclusão | ✅ | `e2e/compras/aprovacoes-solicitacao-compras.spec.js` |
| `CT-CMP-06-S1` | Devolução na Alçada — Regerar Documento | ⬜ | devolução na alçada (regerar documento): consequência de defeito aberto (D-01) + cadastro no ERP (SY1/AL) — declarado, não implementado; provisionamento compete ao cliente |
| `CT-CMP-06-S2` | Devolução na Alçada — Novo Fornecedor (2º colocado) | ⬜ | idem CT-CMP-06-S1 — devolução para novo fornecedor (2º colocado) |
| `CT-CMP-06-S3` | Devolução na Alçada — Retornar para Cotação | ⬜ | idem CT-CMP-06-S1 — retorno para Cotação |
| `CT-CMP-06-S4` | Devolução na Alçada — Retornar para Negociação | ⬜ | idem CT-CMP-06-S1 — retorno para Negociação |
| `CT-CMP-06-S5` | Devolução na Alçada — Cancelar Solicitação | ⬜ | idem CT-CMP-06-S1 — cancelamento a partir da alçada |
| `CT-CMP-07-S1` | Regressão do fail-open do formulário clássico de SC | ✅ | `e2e/compras/fail-open-formulario-sc.spec.js` |
| `CT-CMP-08-H` | Fechar o ciclo de retorno: reprovação → Correção → reenvio | ✅ | `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` |
| `CT-COT-01-H` | Cotação sem parecer técnico (feliz) | ✅ | `e2e/compras/abertura-cotacao.spec.js` · `e2e/compras/ciclo-cotacao.spec.js` |
| `CT-COT-01-S1` | Cotação COM parecer técnico | ✅ | `e2e/compras/ciclo-cotacao.spec.js` |
| `CT-COT-02-S1` | Totais inconsistentes | ✅ | `e2e/compras/ciclo-cotacao.spec.js` |
| `CT-COT-02-S2` | Cotação com validade vencida | ✅ | `e2e/compras/ciclo-cotacao.spec.js` |
| `CT-COT-02-S3` | CNPJ/CPF do fornecedor inválido | ✅ | `e2e/compras/ciclo-cotacao.spec.js` |
| `CT-COT-03-H` | Com dispensa de cotação, exatamente 1 fornecedor é aceito | ⬜ | regra de concorrência (dispensa ⇒ exatamente 1 fornecedor): nenhuma SC da automação chega à Cotação (D-01) e `TOTVS-FS` não é comprador na SY1 — declarado, não implementado; provisionamento compete ao cliente |
| `CT-COT-03-S1` | Sem dispensa de cotação, 2 fornecedores são recusados (mínimo 3) | ⬜ | idem CT-COT-03-H — sem dispensa, 2 fornecedores devem ser recusados (mínimo 3) |
| `CT-COT-03-S2` | Com dispensa de cotação, 2 fornecedores são recusados | ⬜ | idem CT-COT-03-H — com dispensa, 2 fornecedores devem ser recusados |
| `CT-DEL-01-H` | Delegar fiscal válido (feliz) | ✅ | `e2e/contratos/delegacao-fiscais-ciclo.spec.js` · `e2e/contratos/delegacao-fiscais.spec.js` |
| `CT-DEL-01-S1` | Substituto inválido / sem permissão | ✅ | `e2e/contratos/delegacao-fiscais-ciclo.spec.js` |
| `CT-DEL-01-S2` | Período sobreposto | ✅ | `e2e/contratos/delegacao-fiscais-ciclo.spec.js` |
| `CT-DEP-01-H` | Cadastrar dependente (feliz) | ⬜ | o formulário de Dependentes não monta campo sem matrícula ativa |
| `CT-DEP-01-S1` | Dependente duplicado | ⬜ | idem CT-DEP-01-H |
| `CT-DEP-01-S2` | Grau de parentesco incompatível | ⬜ | idem CT-DEP-01-H |
| `CT-DEP-01-S3` | CPF inválido | ⬜ | idem CT-DEP-01-H |
| `CT-DEP-02-S1` | Titular sem matrícula / múltiplos vínculos | ✅ | `e2e/rh/dependentes.spec.js` |
| `CT-E2E-01-H` | Etapa 1 — SC nasce no estado correto e com o dono correto | ✅ | `e2e/acompanhamento-contratos/ciclo-gestor.spec.js` · `e2e/acompanhamento-contratos/payload-solicitacao.spec.js` |
| `CT-E2E-02-H` | Etapa 2 — Validação do Gestor Imediato (aprovar) | ✅ | `e2e/acompanhamento-contratos/ciclo-gestor.spec.js` |
| `CT-E2E-02-S1` | Etapa 2 — Reprovação devolve para correção **preservando os dados do contrato** | ✅ | `e2e/acompanhamento-contratos/ciclo-correcao-reenvio.spec.js` · `e2e/acompanhamento-contratos/ciclo-gestor.spec.js` |
| `CT-E2E-03-H` | Etapa 3 — Validação Orçamentária | ✅ | `e2e/portais/alcadas-orcamentaria.spec.js` |
| `CT-E2E-03-S1` | Etapa 3 — Valor acima da alçada | ✅ | `e2e/portais/alcadas-orcamentaria.spec.js` |
| `CT-E2E-04-H` | Etapa 4 — Validação de Compradores / Alçadas | ✅ | `e2e/portais/alcadas-orcamentaria.spec.js` |
| `CT-E2E-05-H` | Etapa 5 — Gerência de Compras atribui a SC a um comprador | ✅ | `e2e/portais/atribuicao-comprador.spec.js` · `e2e/portais/gerencia-compras.spec.js` |
| `CT-E2E-06-H` | Etapa 6 — Portal do Comprador: Validação Inicial | ✅ | `e2e/portais/ciclo-comprador.spec.js` · `e2e/portais/portal-comprador.spec.js` |
| `CT-E2E-07-H` | Etapa 7 — Controle de Cotações | ✅ | `e2e/portais/ciclo-comprador.spec.js` |
| `CT-E2E-08-H` | Etapa 8 — Avaliação de Propostas | ✅ | `e2e/portais/ciclo-comprador.spec.js` |
| `CT-E2E-09-H` | Etapa 9 — Definir Vencedor da Cotação | ✅ | `e2e/portais/ciclo-comprador.spec.js` |
| `CT-E2E-10-H` | Etapa 10 — Encerramento e retorno ao ERP | ✅ | `e2e/portais/ciclo-comprador.spec.js` |
| `CT-E2E-11-H` | Rastreio transversal pelo Tracker | ✅ | `e2e/portais/ciclo-comprador.spec.js` · `e2e/portais/tracker-compras.spec.js` |
| `CT-E2E-12-S1` | Duas SCs para o mesmo contrato/revisão | ✅ | `e2e/acompanhamento-contratos/criacao-solicitacao.spec.js` |
| `CT-FAT-01-H` | Medição + 3 validações (feliz) | ✅ | `e2e/contratos/ciclo-faturamento.spec.js` · `e2e/contratos/faturamento-contratos.spec.js` |
| `CT-FAT-02-S1` | Quantidade acima do saldo a medir | ✅ | `e2e/contratos/ciclo-faturamento.spec.js` · `e2e/contratos/faturamento-contratos.spec.js` · `e2e/contratos/validacoes-faturamento.spec.js` |
| `CT-FAT-02-S2` | Competência fechada | ✅ | `e2e/contratos/validacoes-faturamento.spec.js` |
| `CT-FAT-02-S3` | Reprovação em uma das validações | ✅ | `e2e/contratos/validacoes-faturamento.spec.js` |
| `CT-FAT-02-S4` | Rateio ≠ 100% | ✅ | `e2e/contratos/faturamento-contratos.spec.js` · `e2e/contratos/validacoes-faturamento.spec.js` |
| `CT-FAT-03-S1` | Medição automática vs manual | ⬜ | compara medição automática × manual, e `dsSync_executeMedicaoManual` está inativo (U-09) |
| `CT-FER-01-H` | Solicitar e aprovar férias (feliz) | ⬜ | o processo `wf_solicitacao_ferias` barra o usuário de Compras — exige grupo de RH |
| `CT-FER-01-S1` | Saldo insuficiente | ⬜ | idem CT-FER-01-H |
| `CT-FER-01-S2` | Período em conflito | ⬜ | idem CT-FER-01-H |
| `CT-FER-01-S3` | Reprovação do gestor | ⬜ | idem CT-FER-01-H |
| `CT-FER-01-S4` | Falha na integração com a folha | ⬜ | idem CT-FER-01-H |
| `CT-FIN-01-H` | Rejeições de Pagamentos — uma área inteira sem cobertura | ✅ | `e2e/financeiro/rejeicoes-pagamentos.spec.js` |
| `CT-FOR-01-H` |  | ✅ | `e2e/contratos/cadastro-fornecedor.spec.js` |
| `CT-GED-01-H` | Navegar a árvore de pastas | ✅ | `e2e/documentos/navegacao-documentos.spec.js` |
| `CT-GED-02-H` | Upload de documento | ✅ | `e2e/documentos/gestao-documentos.spec.js` |
| `CT-GED-02-S1` | Upload de tipo/tamanho não permitido | ✅ | `e2e/documentos/bloqueio-extensoes.spec.js` · `e2e/documentos/gestao-documentos.spec.js` |
| `CT-GED-02-S2` | Bloqueio de extensão: allowlist, não blacklist do `.exe` | ✅ | `e2e/documentos/bloqueio-extensoes.spec.js` |
| `CT-GED-03-H` | Check-out / Check-in | ⬜ | check-out usa protocolo `dav4:`/WebDAV nativo, fora do alcance de qualquer automação de navegador |
| `CT-GED-03-S1` | Check-out concorrente | ⬜ | idem CT-GED-03-H |
| `CT-GED-04-H` | Aprovação de documento | ✅ | `e2e/documentos/gestao-documentos.spec.js` · `e2e/documentos/rejeicao-documento.spec.js` |
| `CT-GED-04-S1` | Rejeitar documento — o caminho e o `msgId` que mente | ✅ | `e2e/documentos/rejeicao-documento.spec.js` |
| `CT-GED-05-H` | Lixeira — excluir e restaurar | ✅ | `e2e/documentos/lixeira-documentos.spec.js` |
| `CT-INT-01-H` | Datasets de consulta retornam dados (feliz) | ✅ | `e2e/seguranca/integracao-protheus-grade-contratos.spec.js` |
| `CT-INT-01-S1` | ERP indisponível | ✅ | `e2e/seguranca/integracao-protheus-grade-contratos.spec.js` |
| `CT-INT-02-S1` | Sincronização em erro  ⚠️ (U-12) | ✅ | `api/sincronizacao-protheus.spec.js` |
| `CT-INT-03-S1` | Dado defasado de dataset `_Sync` | ✅ | `api/sincronizacao-protheus.spec.js` |
| `CT-JUR-01-H` | Consultivo — solicitação → parecer → aprovação (feliz) | ✅ | `e2e/juridico/sigajuri-consultivo.spec.js` |
| `CT-JUR-01-S1` | Consultivo sem aprovador na área | ✅ | `e2e/juridico/sigajuri-consultivo.spec.js` |
| `CT-JUR-01-S2` | Prazo estourado | ✅ | `e2e/juridico/sigajuri-consultivo.spec.js` |
| `CT-JUR-02-S1` | Acesso público indevido  🔒 | ✅ | `e2e/juridico/sigajuri-consultivo.spec.js` |
| `CT-JUR-03-H` | Contrato — geração de minuta (feliz) | ✅ | `e2e/juridico/sigajuri-contrato.spec.js` |
| `CT-JUR-03-S1` | Contrato sem dados obrigatórios da minuta | ✅ | `e2e/juridico/sigajuri-contrato.spec.js` |
| `CT-JUR-04-H` | Contencioso — roteamento por área (feliz) | ✅ | `e2e/juridico/sigajuri-contencioso.spec.js` |
| `CT-JUR-04-S1` | Contencioso sem parte contrária | ✅ | `e2e/juridico/sigajuri-contencioso.spec.js` |
| `CT-JUR-05-H` | Follow-up de processo jurídico (feliz) | ⬜ | processo inoperante: só campos `readonly`, disparado por processo pai |
| `CT-JUR-06-H` | Contencioso: nasce no pool certo? | ✅ | `e2e/juridico/sigajuri-contencioso.spec.js` |
| `CT-NEG-01-H` | Validação de proposta — aprovada (feliz) | ✅ | `e2e/compras/negociacao-proposta.spec.js` |
| `CT-NEG-01-S1` | Validação de proposta — reprovada | ✅ | `e2e/compras/negociacao-proposta.spec.js` |
| `CT-NEG-01-S2` | Proposta fora do prazo | ✅ | `e2e/compras/negociacao-proposta.spec.js` |
| `CT-NOT-01-H` | Disparo multicanal (feliz) | ✅ | `e2e/notificacoes/disparo-multicanal.spec.js` |
| `CT-NOT-01-S1` | Falha de canal não derruba o processo | ⬜ | os datasets de canal são invocados server-side; não há requisição a interceptar |
| `CT-NOT-02-S1` | Alertas automáticos sem duplicidade | ✅ | `e2e/notificacoes/alertas-automaticos.spec.js` |
| `CT-NOT-03-S1` | Contratos da API de notificação | ✅ | `e2e/notificacoes/contratos-api-notificacao.spec.js` |
| `CT-OCO-01-H` | Registrar e aprovar ocorrência (feliz) | ⬜ | o processo `wf_aprovacao_ocorrencia` barra o usuário de Compras — exige grupo de RH |
| `CT-OCO-01-S1` | Ocorrência sem aprovador | ⬜ | idem CT-OCO-01-H |
| `CT-PAR-01-H` | Parecer emitido pelo responsável (feliz) | ✅ | `e2e/compras/parecer-tecnico.spec.js` |
| `CT-PAR-01-S1` | Parecer sem responsável definido | ✅ | `e2e/compras/parecer-tecnico.spec.js` |
| `CT-PAR-01-S2` | Parecer reprovando a cotação | ✅ | `e2e/compras/parecer-tecnico.spec.js` |
| `CT-PFN-01-H` | Login por nível de acesso (feliz) | ✅ | `e2e/portais/acesso-fornecedor.spec.js` · `e2e/portais/portal-fornecedor.spec.js` |
| `CT-PFN-01-S1` | Credencial inválida | ✅ | `e2e/portais/acesso-fornecedor.spec.js` · `e2e/portais/portal-fornecedor.spec.js` |
| `CT-PFN-01-S2` | Força bruta / bloqueio | ⬜ | força bruta real não se executa contra o ambiente — decisão, não limitação |
| `CT-PFN-02-H` | Reset de senha — link de uso único (feliz) | ⬜ | exige credencial de fornecedor (CNPJ/CPF/senha), inexistente em homologação |
| `CT-PFN-02-S1` | Reutilização do link de reset | ✅ | `e2e/portais/acesso-fornecedor.spec.js` |
| `CT-PFN-02-S2` | Link de reset expirado/adulterado | ✅ | `e2e/portais/acesso-fornecedor.spec.js` |
| `CT-PFN-03-H` | Primeiro Acesso / Cadastro de Fornecedor (feliz) | ⬜ | idem CT-PFN-02-H |
| `CT-PFN-03-S1` | Cadastro fora do prazo | ✅ | `e2e/portais/acesso-fornecedor.spec.js` |
| `CT-PFN-04-H` | Participação em Cotações (feliz) | ⬜ | idem CT-PFN-02-H |
| `CT-PFN-05-H` | Envio de Documentos Fiscais (feliz) | ⬜ | idem CT-PFN-02-H |
| `CT-PFN-06-S1` | XSS/injeção no chat do fornecedor  🔒 | ⬜ | injeção XSS real não se executa contra o ambiente — decisão, não limitação |
| `CT-PFN-07-S1` | Isolamento entre fornecedores (IDOR) | ⬜ | IDOR exige duas contas de fornecedor; nenhuma disponível |
| `CT-PLT-01-H` | Home carrega apps e contadores | ✅ | `e2e/plataforma/home.spec.js` |
| `CT-PLT-02-H` | Menu Processos abre o painel de ações | ✅ | `e2e/plataforma/catalogo-processos.spec.js` |
| `CT-PLT-03-H` | Usuário COM permissão inicia o processo | ✅ | `e2e/plataforma/inicio-processo-permitido.spec.js` |
| `CT-PLT-03-S1` | Usuário SEM permissão é bloqueado no início | ✅ | `e2e/plataforma/inicio-processo-bloqueado.spec.js` |
| `CT-PLT-04-S1` | Deep-link/refresh de página SPA | ✅ | `e2e/plataforma/deep-link-spa.spec.js` |
| `CT-PLT-04-S2` | Deep-link além das duas rotas de hoje | ✅ | `e2e/plataforma/deep-link-spa.spec.js` |
| `CT-PLT-05-H` | Favoritar e acessar via Favoritos | ✅ | `e2e/plataforma/favoritos-contrato-api.spec.js` · `e2e/plataforma/favoritos.spec.js` |
| `CT-PLT-06-S1` | Erro de console fora da home | ✅ | `e2e/plataforma/erros-de-console.spec.js` |
| `CT-PLT-07-S1` | `addFavorites` duplicado responde 500 em texto puro | ✅ | `e2e/plataforma/favoritos-contrato-api.spec.js` |
| `CT-PLT-08-S1` | Processo inativo e resíduo de desenvolvimento visível | ✅ | `e2e/plataforma/processo-inativo-e-residuo.spec.js` |
| `CT-PLT-09-S1` | Fechar a matriz dos 9 bloqueios duros | ✅ | `e2e/plataforma/inicio-processo-bloqueado.spec.js` |
| `CT-PLT-10-H` | Invariante do catálogo de processos | ✅ | `e2e/plataforma/catalogo-invariante.spec.js` · `e2e/plataforma/processo-inativo-e-residuo.spec.js` |
| `CT-RDF-01-H` | Recepção de NF condizente (feliz) | ✅ | `e2e/fiscal/recepcao-documentos-fiscais.spec.js` |
| `CT-RDF-01-S1` | NF com inconsistência | ✅ | `e2e/fiscal/recepcao-documentos-fiscais.spec.js` |
| `CT-RDF-01-S2` | Violação de segregação fiscal | ✅ | `e2e/fiscal/recepcao-documentos-fiscais.spec.js` |
| `CT-RDF-01-S3` | NF duplicada | ✅ | `e2e/fiscal/recepcao-documentos-fiscais.spec.js` |
| `CT-RDF-02-H` | Rastreabilidade pai↔filho do RDFC | ✅ | `e2e/fiscal/rastreabilidade-rdfc.spec.js` |
| `CT-SEG-01-S1` | Dataset sem filtro no código (vazamento)  🔒 (observado) | ✅ | `api/dataset-colleague-vazamento.spec.js` · `api/sincronizacao-protheus.spec.js` · `e2e/seguranca/auditoria-datasets.spec.js` · `e2e/seguranca/isolamento-horizontal-api-processos.spec.js` |
| `CT-SEG-02-S1` | Least-privilege dos administradores  🔒 (U-13) | ✅ | `e2e/seguranca/auditoria-datasets.spec.js` |
| `CT-SEG-03-S1` | Credencial de integração exposta  🔒 (U-03) | ✅ | `e2e/seguranca/auditoria-datasets.spec.js` |
| `CT-SEG-04-S1` | Execução de SQL / injeção  🔒 (U-04) | ✅ | `e2e/seguranca/auditoria-datasets.spec.js` |
| `CT-SEG-05-S1` | Acesso admin negado a não-admin  (observado, U-15) | ✅ | `api/webdesk-acesso-admin.spec.js` · `e2e/seguranca/isolamento-horizontal-api-processos.spec.js` · `e2e/seguranca/processos-administrativos-usuario-comum.spec.js` |
| `CT-SEG-06-S1` | Vazamento de dados a serviço externo (LGPD)  (U-11) | ✅ | `e2e/plataforma/erros-de-console.spec.js` · `e2e/seguranca/lgpd-envio-google-analytics.spec.js` |
| `CT-SEG-07-S1` | Isolamento horizontal na API v2 de processos (BOLA/IDOR interno) | ✅ | `e2e/fiscal/rastreabilidade-rdfc.spec.js` · `e2e/seguranca/isolamento-horizontal-api-processos.spec.js` |
| `CT-SEG-08-S1` | Processos administrativos abertos a usuário comum | ✅ | `e2e/seguranca/processos-administrativos-usuario-comum.spec.js` |
| `CT-SEG-10-S1` | ACL dos documentos que a SC cria sozinha no GED | ⬜ | bloqueado: o critério de ACL correta dos documentos/pastas que o workflow gera não foi definido pela Cassi — pergunta em aberto. Assertion frouxa aqui seria pior que ausência de teste. |
| `CT-SUB-01-H` | Definir substituto válido (feliz) | ⬜ | o formulário de Substituição responde "Funcionário não localizado" sem matrícula ativa |
| `CT-SUB-01-S1` | Substituto sem vínculo ativo | ⬜ | idem CT-SUB-01-H |
| `CT-SUB-01-S2` | Período retroativo/ inválido | ⬜ | idem CT-SUB-01-H |
| `CT-SUB-02-H` | Delegação de Tarefas (`wf_SubstituiçãoCargosFluig`) | ✅ | `e2e/rh/delegacao-tarefas.spec.js` |
| `CT-TSK-01-H` | Resumo reflete a carga real | ✅ | `e2e/tarefas/resumo-tarefas.spec.js` |
| `CT-TSK-02-H` | Assumir tarefa do pool | ✅ | `e2e/tarefas/assumir-tarefa-pool.spec.js` · `e2e/tarefas/minhas-solicitacoes.spec.js` |
| `CT-TSK-02-S1` | Concorrência ao assumir a mesma tarefa | ✅ | `e2e/tarefas/assumir-tarefa-pool.spec.js` · `e2e/tarefas/minhas-solicitacoes.spec.js` |
| `CT-TSK-03-H` | Tarefa atrasada é sinalizada | ✅ | `e2e/tarefas/minhas-solicitacoes.spec.js` |
| `CT-TSK-04-H` | Consulta de "Minhas Solicitações" | ✅ | `e2e/tarefas/minhas-solicitacoes.spec.js` |
| `CT-TSK-05-H` | Cancelar solicitação — o fluxo do produto, nunca testado | ✅ | `e2e/tarefas/cancelamento-solicitacao.spec.js` |
| `CT-TSK-05-S1` | Cancelamento sem motivo derruba com NPE 500 | ✅ | `e2e/tarefas/cancelamento-solicitacao.spec.js` |
| `CT-TSK-07-H` | "Somente salvar" — salvar sem movimentar | ✅ | `e2e/tarefas/acoes-da-tarefa.spec.js` |
| `CT-TSK-08-H` | Transferir atividade | ✅ | `e2e/tarefas/acoes-da-tarefa.spec.js` |
