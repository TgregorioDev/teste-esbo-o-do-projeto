# Portal do Fornecedor — comparação chamados × suíte Playwright

Medido em 08/09/2026 sobre `tests/` (198 testes) lendo o corpo dos testes e dos Page Objects, não os títulos.

| Status | Casos |
|---|---|
| COBERTO | 0 |
| APRIMORAR | 2 |
| IMPLEMENTAR | 22 |
| **Total** | **24** |

## Leitura do módulo

**Nenhum caso COBERTO.** A suíte para na porta do portal: `tests/e2e/portais/portal-fornecedor.spec.js` afirma só que a landing oferece três botões e que cada um abre um formulário com campos visíveis (`toBeVisible`), e `acesso-fornecedor.spec.js` prova apenas rejeições (401 com credencial fabricada, token de reset inválido). Nenhum teste autentica como fornecedor, abre cotação ou envia proposta — e **não há credencial de fornecedor nesta rodada**, então os 17 casos que exigem login de fornecedor (617, 644, 645, 2076, 2930, 3156, 3555, 3782, 4245, 4273, 4298, 4826, 5096 e afins) são IMPLEMENTAR por bloqueio de credencial, não "já cobertos pelo teste de acesso negado".

**Specs com oportunidade de APRIMORAR:** `tests/e2e/contratos/cadastro-fornecedor.spec.js` (2 casos: 2752 telefone sem máscara; 3152 acentos/CNPJ duplicado). O teste CT-FOR-01-H só afirma visibilidade de 14 campos e nunca digita nada; Razão Social, Nome Fantasia e Telefone são editáveis e a técnica `captura-payload` (ler o corpo do `workflowView/send` e abortar) permite afirmar normalização sem gravar fornecedor no Protheus.

**IMPLEMENTAR de maior valor, viáveis hoje sem credencial de fornecedor:**
1. **FSWTBC-1792** — GET dos três WSDL SOAP com a sessão da plataforma (200, `text/xml`, operações declaradas). Barato e é o pré-requisito de todo envio de proposta.
2. **FSWTBC-4765 / 5096 (metade interna)** — invariante por API v2: nenhuma negociação OPEN presa em "Aguarda Movimentação Protheus" (34) ou atribuída a "Administrador Cassi". O caso mediu 117 movimentos por 34/36 e um único por Correção (51).
3. **FSWTBC-5257 e a metade pública de 3152** — o auto-cadastro público `/portal/p/1/cadastro_fornecedor` não é tocado por teste algum, e o campo CNPJ está inutilizável (a máscara transforma qualquer digitação no literal `AA.AAA.AAA/AAAA-00`): nasce como `@bug`.
4. **FSWTBC-3789** — varredura de rótulo "Book Trabalhista" nas 13 páginas do Portal de Compras e Contratos.

**Teste mais fraco do que o título sugere:** "deve abrir o formulário de Acesso Normal com CNPJ, CPF e senha" — o nome soa como fluxo de acesso; o corpo é cinco `toBeVisible` e `guarda.tentativas()===0`. O próprio comentário do arquivo admite que nenhum teste preenche CPF/CNPJ/senha nem clica em Entrar.

## Caso a caso

### FSWTBC-617 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste envia proposta como fornecedor. Bloqueio: sem credencial de fornecedor (CNPJ+CPF+senha). Precisa de login de fornecedor, cotação pendente e leitura da grade tbProposta (Proposta/Versão/Fornecedor/Situação Par. Area Dem.) do lado interno.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-644 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca o envio de proposta. Bloqueio: credencial de fornecedor. O próprio caso registra que hoje o portal aceita valor zero e a integração falha no ERP — quando viável, nasce @bug: interceptar o POST de envio (captura-payload) com item zerado e afirmar recusa no cliente antes de qualquer chamada ao ERP.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-645 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio duplo: cancelar cotação exige Protheus (sem credencial) e observar o efeito exige login de fornecedor. Parcial viável: API v2 de processos — cotação com status cancelado no Fluig não pode ter negociação OPEN em Recepção de Propostas.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-1704 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: os endpoints cotacao/atualiza* são chamados server-side; exige comprador na SY1 e credencial de fornecedor. Único ponto observável sem isso: campo 'Erro retornado pelo ERP Protheus' (#msgerro) das instâncias reais de Cotação/Negociação — varredura por API afirmando que nenhuma contém 'array out of bounds'.
- **Arquivo-alvo:** `tests/api/integracao-cotacao-erp.spec.js (novo)`

### FSWTBC-1792 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca os WSDL. VIÁVEL HOJE sem credencial de fornecedor: GET dos três WSDL (ECMWorkflowEngineService, ECMDocumentService, ECMFolderService) com a sessão da plataforma, afirmar HTTP 200, content-type text/xml, wsdl:definitions e as operações startProcess/simpleStartProcess/startProcessClassic. O envio da proposta em si segue bloqueado por credencial.
- **Arquivo-alvo:** `tests/api/soap-portal-fornecedor.spec.js (novo)`

### FSWTBC-2076 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: credencial de fornecedor pertencente ao grupo de produto. ciclo-cotacao.spec.js só afirma que 'Validade da Cotação' é readonly no shell avulso — não afirma que a data é válida nem que o fornecedor a enxerga.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-2720 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: exige envelhecer um Cadastro de Fornecedor aprovado além do prazo de cobrança e ler a caixa de e-mail do fornecedor — sem acesso a e-mail nem ao agendamento. Parcial viável: por API, processos wf_cadastro_fornecedor já homologados (Aprovado) não podem estar em atividade 13 – Completar Cadastro.
- **Arquivo-alvo:** `tests/api/cadastro-fornecedor-cobranca.spec.js (novo)`

### FSWTBC-2752 — **APRIMORAR**

- **Teste que toca o fluxo:** tests/e2e/contratos/cadastro-fornecedor.spec.js :: CT-FOR-01-H: deve abrir e espelhar os campos de documento, razão social, endereço e contato
- **O que falta:** O teste só afirma que campoTelefone está visível. Acrescentar: digitar telefone cru (só dígitos) em Telefone/Celular, afirmar o valor normalizado no campo e, com captura-payload no POST workflowView/send (ler o corpo e abortar), afirmar que o número sai normalizado e que o envio não quebra — sem gravar fornecedor no Protheus.
- **Arquivo-alvo:** `tests/e2e/contratos/cadastro-fornecedor.spec.js`

### FSWTBC-2930 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: credencial de fornecedor para enviar nova proposta na versão publicada do processo de cotação. Lado interno (Proposta/Versão/Fornecedor na grade) também exige comprador na SY1.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-3152 — **APRIMORAR**

- **Teste que toca o fluxo:** tests/e2e/contratos/cadastro-fornecedor.spec.js :: CT-FOR-01-H: deve abrir e espelhar os campos de documento, razão social, endereço e contato
- **O que falta:** O teste só afirma visibilidade de Razão Social/Nome Fantasia/CNPJ. Acrescentar no formulário interno: digitar 'Ç'/'Á' e afirmar transliteração + caixa alta; preencher CNPJ já existente (descoberto via dataset de fornecedores) e afirmar crítica antes da gravação com guarda.tentativas()===0. O auto-cadastro público (/portal/p/1/cadastro_fornecedor) não é tocado por teste algum e o campo CNPJ está inutilizável pela máscara (vira o literal AA.AAA.AAA/AAAA-00) — spec nova @bug.
- **Arquivo-alvo:** `tests/e2e/contratos/cadastro-fornecedor.spec.js + tests/e2e/contratos/cadastro-fornecedor-publico.spec.js (novo)`

### FSWTBC-3153 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca dados bancários. Bloqueio: conferir A2_XPREST/A2_XHPREST na SA2 e a implantação da NF exige Protheus. Parcial viável: preencher o bloco bancário no formulário interno e, via captura-payload, afirmar que os campos saem no payload sem o sentinela 999999.
- **Arquivo-alvo:** `tests/e2e/contratos/cadastro-fornecedor.spec.js`

### FSWTBC-3156 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio duplo: incluir participante exige comprador na SY1 (Controle De Cotações vem vazio para a conta QA mesmo com 'Atuar como' — ciclo-comprador.spec.js CT-E2E-07-H) e atualizar proposta exige credencial de fornecedor.
- **Arquivo-alvo:** `tests/e2e/portais/ciclo-comprador.spec.js + tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-3555 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: credencial de fornecedor para alterar quantidade + comprador na SY1 para ler a Avaliação de Propostas e o modal 'Definir Quantidade'. ciclo-comprador.spec.js CT-E2E-08-H só afirma os cabeçalhos da grade e que ela está vazia.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-3781 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca a página de Documentação Obrigatória. Bloqueio: parametrizar permissão de página exige admin do Fluig e um usuário participante do RDFC — recepcao-documentos-fiscais.spec.js prova que as 5 variantes do RDFC bloqueiam a conta QA (isso cobre apenas o análogo do passo 6: negativa explícita, mas na tela de início do processo, não na página da documentação).
- **Arquivo-alvo:** `tests/e2e/fiscal/documentacao-obrigatoria.spec.js (novo)`

### FSWTBC-3782 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: credencial de fornecedor do contrato 00005-2023-3501. portal-fornecedor.spec.js para na landing (três botões visíveis) e nunca autentica.
- **Arquivo-alvo:** `tests/e2e/portais/documentacao-fornecedor.spec.js (novo)`

### FSWTBC-3789 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste procura o rótulo. Ponto 1 VIÁVEL HOJE: varrer as 13 páginas do grupo 'Portal de Compras e Contratos' (menu Páginas) e a landing do Portal do Fornecedor afirmando ausência de 'Book Trabalhista'/'Book' e presença de 'Documentação Obrigatória' onde houver documentação de contrato. Ponto 2 (área logada do fornecedor) bloqueado por credencial; ponto 3 (CN9_XBOOK) bloqueado por Protheus.
- **Arquivo-alvo:** `tests/e2e/portais/nomenclatura-documentacao-obrigatoria.spec.js (novo)`

### FSWTBC-4245 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: SC própria nunca passa da Validação Orçamentária (alcadas-orcamentaria.spec.js), logo não chega à etapa 161 'Aguarda Finalizar Cotação'; reenvio da proposta 02 exige credencial de fornecedor; 'Verificar Parecer Técnico' exige comprador na SY1.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-4273 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio duplo: movimentar sem alterar valor exige credencial de fornecedor; ler as mensagens 'Não é possível aprovar/negociar essa proposta, pois existe uma proposta mais recente' exige comprador com cotação na Avaliação de Propostas (vazia para a conta QA).
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-4298 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: 'Retornar para Negociação' vive na Validação do Comprador (Alçadas, 210) — aprovador nominal AL/DHL, fora da conta QA; o reenvio com valor menor exige credencial de fornecedor.
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-4765 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Provocar (fornecedor representar) está bloqueado por credencial, mas o INVARIANTE é verificável hoje só de leitura: por API v2 de processos, nenhuma instância OPEN de wf_negociacao_cotacao_prod_serv pode estar em 'Aguarda Movimentação Protheus' (34) há mais de N minutos nem com responsável 'Administrador Cassi'; instância em Correção (51) precisa ter responsável de grupo.
- **Arquivo-alvo:** `tests/api/negociacao-aguarda-movimentacao.spec.js (novo)`

### FSWTBC-4826 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Bloqueio: campo de quantidade da proposta só existe logado como fornecedor; B1_UM/B1_FRACPER exigem Protheus. Parcial viável: ler B1_UM/B1_FRACPER via dataset de produtos e afirmar coerência com a quantidade gravada nas propostas reais (API).
- **Arquivo-alvo:** `tests/e2e/portais/proposta-fornecedor.spec.js (novo)`

### FSWTBC-5096 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste. Envio com quantidade 0 exige credencial de fornecedor. A segunda metade (negociação nunca desviada para colaborador interno) é verificável por leitura: instâncias de negociação com Histórico 'C8_QUANT não foi preenchido' não podem estar atribuídas a usuário interno fora do grupo de Correção — mesma técnica do invariante de FSWTBC-4765.
- **Arquivo-alvo:** `tests/api/negociacao-aguarda-movimentacao.spec.js (novo)`

### FSWTBC-5117 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca os botões de ação da proposta em Avaliação de Propostas. Bloqueio: comprador na SY1 (grade vazia para a conta QA, ciclo-comprador.spec.js CT-E2E-08-H). Parcial viável: por API, tarefas de 'Ajuste de Negociação' abertas devem ter responsável igual ao hd_atribuicao do formulário da proposta.
- **Arquivo-alvo:** `tests/e2e/portais/ciclo-comprador.spec.js`

### FSWTBC-5257 — **IMPLEMENTAR**

- **O que falta:** Nenhum teste toca o auto-cadastro público (/portal/p/1/cadastro_fornecedor). VIÁVEL HOJE como @bug: digitar CNPJ alfanumérico com DV válido no campo CNPJ e afirmar que o valor aparece em maiúsculas — hoje a máscara jquery.maskedinput transforma qualquer digitação no literal AA.AAA.AAA/AAAA-00. Metade 'autenticar' pode entrar em acesso-fornecedor.spec.js (Acesso Normal com CNPJ alfanumérico fabricado deve responder 401 controlado, não 400/500); gerarCnpjFicticio hoje só gera dígitos.
- **Arquivo-alvo:** `tests/e2e/contratos/cadastro-fornecedor-publico.spec.js (novo) + tests/e2e/portais/acesso-fornecedor.spec.js`

