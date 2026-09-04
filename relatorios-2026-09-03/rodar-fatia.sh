#!/usr/bin/env bash
# Roda uma fatia NÃO destrutiva (PULAR_DESTRUTIVOS=1) em primeiro plano, com JSON por fatia.
# Uso: relatorios-2026-09-03/rodar-fatia.sh <chave> <pasta>
k="$1"; pasta="$2"
echo "== fatia $k ($pasta) inicio $(date +%H:%M:%S)"
PULAR_DESTRUTIVOS=1 \
PLAYWRIGHT_JSON_OUTPUT_FILE="relatorios-2026-09-03/$k.json" \
PLAYWRIGHT_JSON_OUTPUT_NAME="relatorios-2026-09-03/$k.json" \
npx playwright test "$pasta" --reporter=line,json --output="test-results-0903/$k" 2>&1 | grep -E '^\s+[0-9]+ (passed|failed|flaky|skipped)|Error|Timeout|✘|^\s+[0-9]+\) ' | head -60
echo "== fatia $k fim $(date +%H:%M:%S)"
