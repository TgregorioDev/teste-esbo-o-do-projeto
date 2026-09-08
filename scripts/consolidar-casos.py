#!/usr/bin/env python3
"""Consolida os casos gerados por lote em `Casos de Testes - SDCASSI/`.

Entrada : /tmp/jira_sdcassi/casos/saida/L*.md   (um arquivo por lote)
Saida   : <destino>/  README.md + um .md por modulo Fluig
          <destino>/Protheus/  README.md + um .md por modulo do ERP

Roteamento: caso com "SOMENTE PROTHEUS" (ou "FORA DO ESCOPO FRONT-END") no
campo Bloqueio vai para Protheus/, no modulo declarado em "Modulo ERP:".
Os demais vao para o modulo Fluig inferido do campo "Modulo/Rota".
"""
import re, sys, glob, json, unicodedata
from pathlib import Path
from collections import defaultdict, Counter

SAIDA = Path('/tmp/jira_sdcassi/casos/saida')
PLANO = Path('/tmp/jira_sdcassi/casos/PLANO.json')
DESTINO = Path(sys.argv[1] if len(sys.argv) > 1 else 'Casos de Testes - SDCASSI')


def semacento(s):
    s = unicodedata.normalize('NFKD', s)
    return ''.join(c for c in s if not unicodedata.combining(c)).lower()


# --- modulos do Fluig, na ordem em que sao testados (regra: primeira que casar) ---
MODULOS_FLUIG = [
    ("Corretagens",              ["corretor", "corretagen"]),
    ("RH e Administrativos",     ["ferias", "aprovacao de ocorrencia", "wf_aprovacao_ocorrencia",
                                  "banco de horas", "delegacao de tarefa", "ponto eletronico", "reembolso"]),
    ("Faturamento de Contratos", ["faturamento de contrato", "wf_faturamento", "realizar medicao",
                                  "medicao do", "fatcon"]),
    ("Portal do Fornecedor",     ["portal do fornecedor", "portal_fornecedor", "cadastro de fornecedor",
                                  "wf_cadastro_fornecedor"]),
    ("Parecer Tecnico",          ["parecer tecnico"]),
    ("Portal do Comprador",      ["portal do comprador", "portal-do-comprador", "cotac",
                                  "avaliacao de proposta", "definir vencedor", "validacao inicial", "negociac"]),
    ("Gerencia de Compras",      ["gerencia de compras", "gerenciacompras", "distribuicao comprador"]),
    ("Gestao de Equipes",        ["gestao de equipes", "gestao_equipes", "arvore hierarquica"]),
    ("Contratos",                ["acompanhamento de contrato", "nova contratacao", "revisao de contrato",
                                  "aditivo", "contrato"]),
    ("Consultas e Logs",         ["tracker", "logs protheus", "portal_logs"]),
    ("Solicitacao de Compras",   ["solicitacao de compras", "wf_solicitacao", "alcada",
                                  "validacao orcamentaria", "validacao do gestor", "rateio",
                                  "validacao do comprador", "iniciar solicitacoes"]),
    ("Plataforma",               ["central de tarefas", "pagecentraltask", "home", "login", "transversal"]),
]

MODULOS_ERP = ["Compras", "Contratos - GCT", "Financeiro e Contabil",
               "Integracao e Filas", "Dicionario e Pacote", "RH - Folha", "Outros"]

# quando o agente nao declarou "Modulo ERP", inferir do texto do caso
ERP_PALAVRAS = [
    ("RH - Folha",           ["sigagpe", "sigapon", "folha de pagamento", "ra_", "ponto eletronico",
                              "verba", "pro-rata", "abono", "rescisao", "admissao"]),
    # "fila/schedule/ZZY/ZZZ" é sinal mais específico que "medição": vem antes de
    # Contratos-GCT, senão todo caso de fila de medição cai no módulo errado.
    ("Integracao e Filas",   ["zzy", "zzz", "fila", "schedule", "job", "ugcte", "cv8", "ejb"]),
    ("Contratos - GCT",      ["sigagct", "cn9", "cna", "cnb", "cnf", "cnc", "medicao", "planilha do contrato"]),
    ("Financeiro e Contabil",["lancamento contabil", "contabiliza", "se1", "se2", "titulo", "apropriacao",
                              "lp/cp", "sigafin", "sigactb", "fkw", "finm"]),
    ("Dicionario e Pacote",  ["sx3", "sx2", "six", "dicionario", "rpo", "pacote", "patch", "compilac"]),
    ("Compras",              ["sc1", "sc7", "sc8", "mata11", "mata12", "mata15", "sigacom", "pedido de compra",
                              "cotacao", "solicitacao de compra"]),
]

CAMPO = {
    'modulo':   re.compile(r'^\*\*M[óo]dulo/Rota:\*\*(.*)$', re.M),
    'moderp':   re.compile(r'^\*\*M[óo]dulo ERP:\*\*(.*)$', re.M),
    'bloqueio': re.compile(r'^\s*[-*]?\s*\*\*Bloqueio:\*\*(.*)$', re.M),
    'verific':  re.compile(r'^\*\*Verificado em tela:\*\*\s*(\w+)', re.M),
    'titulo':   re.compile(r'^\*\*T[íi]tulo:\*\*(.*)$', re.M),
    'sever':    re.compile(r'^\*\*Severidade:\*\*\s*(\w+)', re.M),
}
E_PROTHEUS = re.compile(r'SOMENTE PROTHEUS|FORA DO ESCOPO FRONT-?END', re.I)

# Casos escritos antes de a marcação existir: o campo Módulo/Rota diz, sozinho, que o
# caso vive no ERP. Só vale quando NÃO há rota do Fluig no mesmo campo.
SO_ERP_NA_ROTA = re.compile(
    r'^\s*\**\s*protheus\b|schedule\b|aplicac[ao]o de pacote|dicion[áa]rio da tabela|rotina\s+ugcte',
    re.I)
TEM_ROTA_FLUIG = re.compile(r'fluig|/portal/|wf_|widget|tracker|formul[áa]rio', re.I)


def campo(bloco, nome):
    m = CAMPO[nome].search(bloco)
    return m.group(1).strip() if m else ""


def modulo_fluig(texto):
    t = semacento(texto)
    for nome, palavras in MODULOS_FLUIG:
        if any(p in t for p in palavras):
            return nome
    return "Outros"


def modulo_erp(declarado, bloco):
    d = declarado.strip().strip('`').strip()
    for m in MODULOS_ERP:
        if semacento(m) == semacento(d):
            return m
    t = semacento(bloco)
    for nome, palavras in ERP_PALAVRAS:
        if any(p in t for p in palavras):
            return nome
    return "Outros"


def normalizar_moderp(bloco, mod, protheus):
    """Faz a linha 'Módulo ERP' concordar com o arquivo em que o caso foi arquivado.

    Vários agentes declararam um módulo e anotaram entre parênteses que o real era outro
    (SIGAGPE, SIGAPON). O roteador usa o real; sem esta normalização o caso diria
    `Financeiro e Contabil` dentro de `RH - Folha.md`, contradizendo o próprio arquivo.
    A anotação de origem é preservada — é ela que carrega o módulo verdadeiro do ERP.
    """
    if not protheus:
        return bloco
    m = CAMPO['moderp'].search(bloco)
    if m:
        resto = m.group(1).strip()
        nota = re.search(r'\*\(.*?\)\*', resto)
        linha = f"**Módulo ERP:** `{mod}`" + (f" {nota.group(0)}" if nota else "")
        return bloco[:m.start()] + linha + bloco[m.end():]
    # caso de ERP escrito antes de a linha existir: insere logo após Módulo/Rota
    mr = CAMPO['modulo'].search(bloco)
    if mr:
        return (bloco[:mr.end()] + f"\n\n**Módulo ERP:** `{mod}`" + bloco[mr.end():])
    return bloco


def carregar():
    casos, vistos, dup = [], set(), []
    for arq in sorted(SAIDA.glob('L*.md')):
        texto = arq.read_text(encoding='utf-8', errors='replace')
        for bloco in re.split(r'\n(?=#{2,3}\s*CT-)', texto):
            m = re.match(r'#{2,3}\s*CT-(FSWTBC-\d+)', bloco)
            if not m:
                continue
            key = m.group(1)
            if key in vistos:
                dup.append((key, arq.name))
                continue
            vistos.add(key)
            blq = campo(bloco, 'bloqueio')
            rota = campo(bloco, 'modulo')
            protheus = bool(E_PROTHEUS.search(blq)) or bool(E_PROTHEUS.search(bloco))
            # lotes antigos não tinham a marcação: a própria rota denuncia o caso de ERP
            if not protheus and SO_ERP_NA_ROTA.search(rota) and not TEM_ROTA_FLUIG.search(rota):
                protheus = True
            mod = (modulo_erp(campo(bloco, 'moderp'), bloco) if protheus
                   else modulo_fluig(rota))
            # campo Módulo/Rota malformado (multilinha) derruba tudo em "Outros":
            # reclassifica pelo corpo inteiro do caso antes de desistir
            if mod == "Outros" and not protheus:
                mod = modulo_fluig(bloco)
            casos.append({
                'key': key,
                'num': int(key.split('-')[1]),
                'lote': arq.stem,
                'titulo': campo(bloco, 'titulo'),
                'verificado': (campo(bloco, 'verific') or '?').upper()[:3],
                'severidade': campo(bloco, 'sever'),
                'protheus': protheus,
                'modulo': mod,
                'texto': normalizar_moderp(bloco, mod, protheus).rstrip() + '\n',
            })
    return casos, dup


CABECALHO = """<!-- Gerado por scripts/consolidar-casos.py — não edite à mão. -->

# {titulo}

{subtitulo}

| | |
|---|---|
| Casos neste arquivo | {n} |
| Verificados em tela | {sim} total · {parcial} parcial · {nao} não |

{aviso}
---

"""

AVISO_FLUIG = """> **Como ler.** Cada caso descreve o comportamento **correto esperado hoje**. A maioria dos
> defeitos de origem já foi corrigida — o caso é de regressão: se reprovar, o defeito voltou.
> Os que reprovam hoje por causa nunca corrigida estão marcados no próprio caso.
> *Verificado em tela* diz o que foi conferido no ambiente de homologação em 08/09/2026;
> **PARCIAL** costuma significar que a conta de QA não tem o perfil necessário (comprador,
> gestor, fiscal, fornecedor), não que o caso seja inválido.
"""

AVISO_ERP = """> **Como ler.** Estes casos **não são executáveis no Fluig** — o efeito do defeito só aparece
> no Protheus. Estão escritos por completo, do ponto de vista de quem for executá-los no ERP,
> para quando o projeto de testes cobrir o Protheus. Nenhum foi verificado em tela.
"""


def escrever(casos, dup):
    DESTINO.mkdir(parents=True, exist_ok=True)
    (DESTINO / 'Protheus').mkdir(exist_ok=True)

    grupos = defaultdict(list)
    for c in casos:
        grupos[(c['protheus'], c['modulo'])].append(c)

    linhas_indice = defaultdict(list)
    for (e_prot, mod), lista in sorted(grupos.items(), key=lambda kv: (kv[0][0], -len(kv[1]))):
        lista.sort(key=lambda c: c['num'])
        v = Counter(c['verificado'] for c in lista)
        destino = (DESTINO / 'Protheus' / f'{mod}.md') if e_prot else (DESTINO / f'{mod}.md')
        corpo = CABECALHO.format(
            titulo=mod,
            subtitulo=('Casos de teste do Protheus — registrados para execução futura no ERP.'
                       if e_prot else
                       f'Casos de teste E2E do Fluig — módulo {mod}.'),
            n=len(lista), sim=v.get('SIM', 0), parcial=v.get('PAR', 0), nao=v.get('NAO', 0) + v.get('NÃO', 0),
            aviso=(AVISO_ERP if e_prot else AVISO_FLUIG),
        ) + '\n'.join(c['texto'] for c in lista)
        destino.write_text(corpo, encoding='utf-8')
        linhas_indice[e_prot].append((mod, lista, v))

    plano = json.load(open(PLANO))
    total_plano = sum(l['n'] for l in plano)
    escritos = len(casos)
    n_prot = sum(1 for c in casos if c['protheus'])

    ind = ["# Casos de Testes — SDCASSI e SUPORTE CASSI\n",
           "Casos de teste manuais escritos a partir dos defeitos reais reportados pela CASSI nos",
           "projetos **SDCASSI** e **SUPORTE CASSI**, analisados um a um e verificados no ambiente de",
           "homologação do Fluig em 08/09/2026.\n",
           "| | |", "|---|---|",
           f"| Defeitos no universo analisado | {total_plano} |",
           f"| Casos escritos | {escritos} |",
           f"| Executáveis no Fluig | {escritos - n_prot} |",
           f"| Somente no Protheus (registrados para depois) | {n_prot} |",
           ""]
    v_tot = Counter(c['verificado'] for c in casos if not c['protheus'])
    n_fluig = escritos - n_prot
    n_sim, n_par = v_tot.get('SIM', 0), v_tot.get('PAR', 0)
    n_nao = v_tot.get('NAO', 0) + v_tot.get('NÃO', 0)
    resto = n_fluig - n_sim - n_par - n_nao   # casos sem o campo declarado
    ind += [f"Dos casos de Fluig: **{n_sim}** verificados integralmente em tela, "
            f"**{n_par}** parcialmente, **{n_nao}** não verificados"
            + (f", **{resto}** sem o campo declarado" if resto else "") + ".\n",
            "---\n", "## Fluig — executáveis no ambiente de homologação\n",
            "| Módulo | Casos | Verificado (total/parcial/não) |", "|---|---:|---|"]
    for mod, lista, v in linhas_indice[False]:
        ind.append(f"| [{mod}](<{mod}.md>) | {len(lista)} | {v.get('SIM',0)} / {v.get('PAR',0)} / "
                   f"{v.get('NAO',0)+v.get('NÃO',0)} |")
    ind += ["", "## Protheus — registrados para execução futura no ERP\n",
            "Não são executáveis no Fluig: o efeito do defeito só aparece no Protheus. Estão escritos",
            "por completo para quando o projeto cobrir o ERP.\n",
            "| Módulo do ERP | Casos |", "|---|---:|"]
    for mod, lista, v in linhas_indice[True]:
        ind.append(f"| [{mod}](<Protheus/{mod}.md>) | {len(lista)} |")

    ind += ["", "---\n", "## Índice por defeito\n",
            "| Defeito | Caso | Módulo | Verificado |", "|---|---|---|---|"]
    for c in sorted(casos, key=lambda c: c['num']):
        pasta = f'Protheus/{c["modulo"]}' if c['protheus'] else c['modulo']
        tit = (c['titulo'] or '').replace('|', '\\|')[:90]
        ind.append(f"| {c['key']} | [{tit}](<{pasta}.md>) | {c['modulo']} | {c['verificado']} |")

    if dup:
        ind += ["", f"> Nota: {len(dup)} bloco(s) duplicado(s) entre lotes foram descartados, "
                    "mantida a primeira ocorrência."]

    (DESTINO / 'README.md').write_text('\n'.join(ind) + '\n', encoding='utf-8')

    prot = [x for x in linhas_indice[True]]
    pind = ["# Casos de Teste — Protheus\n",
            "Casos cujo efeito **não é observável em nenhuma tela do Fluig**. Foram escritos por",
            "completo mesmo assim — com rotina, tela ou relatório do ERP onde o efeito aparece —",
            "para que o time não precise refazer a análise quando o projeto de testes cobrir o",
            "Protheus.\n", "| Módulo | Casos |", "|---|---:|"]
    for mod, lista, v in prot:
        pind.append(f"| [{mod}](<{mod}.md>) | {len(lista)} |")
    pind += ["", "| Defeito | Caso | Módulo |", "|---|---|---|"]
    for c in sorted((c for c in casos if c['protheus']), key=lambda c: c['num']):
        tit = (c['titulo'] or '').replace('|', '\\|')[:90]
        pind.append(f"| {c['key']} | [{tit}](<{c['modulo']}.md>) | {c['modulo']} |")
    (DESTINO / 'Protheus' / 'README.md').write_text('\n'.join(pind) + '\n', encoding='utf-8')

    return grupos, escritos, n_prot


if __name__ == '__main__':
    casos, dup = carregar()
    grupos, escritos, n_prot = escrever(casos, dup)
    print(f"casos consolidados: {escritos}  (Fluig {escritos-n_prot} · Protheus {n_prot})")
    if dup:
        print(f"duplicados descartados: {dup}")
    for (e_prot, mod), lista in sorted(grupos.items(), key=lambda kv: (kv[0][0], -len(kv[1]))):
        print(f"  {'ERP  ' if e_prot else 'Fluig'}  {mod:28s} {len(lista):4d}")
