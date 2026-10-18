#!/usr/bin/env bash
# v2 parçalarını tek, kopyalanıp yapıştırılabilir prompt dosyasında birleştirir.
set -euo pipefail
cd "$(dirname "$0")"
out="INCELEMELER-MASTER-PROMPT-v2.md"
first=1
: > "$out"
for f in v2/*.md; do
  if [ $first -eq 0 ]; then printf '\n\n---\n\n' >> "$out"; fi
  cat "$f" >> "$out"
  first=0
done
echo "$out: $(wc -l < "$out") satır, $(wc -c < "$out") bayt"
