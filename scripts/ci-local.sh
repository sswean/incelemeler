#!/usr/bin/env bash
# `pnpm ci:local` — CI ile aynı adımları yerelde çalıştırır (X-031 sağlanana kadar §8.3).
# Sonuç .ci-local/last-run.json dosyasına yazılır; req:check (b) bunu kullanır.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p .ci-local
started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
commit="$(git rev-parse --short HEAD)"
dirty="$(git status --porcelain | wc -l | tr -d ' ')"

run() {
  echo "::group:: $1"
  shift
  if "$@"; then echo "✔ ok"; else echo "✖ BAŞARISIZ: $*"; failed=1; fi
}

failed=0
run "format" pnpm format:check
run "lint" pnpm lint
run "deps" pnpm deps:check
run "typecheck" pnpm typecheck
run "unit" pnpm test
run "integration" pnpm test:integration
run "build" pnpm build
run "openapi" pnpm openapi:check
run "licenses" node scripts/license-check.mjs
run "audit" pnpm audit --audit-level=high --prod
run "secrets" docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source /repo --no-banner --redact
run "e2e" pnpm test:e2e

write_result() {
  local passed
  passed=$([ "$failed" -eq 0 ] && echo true || echo false)
  printf '{ "startedAt": "%s", "finishedAt": "%s", "commit": "%s", "uncommittedFiles": %s, "passed": %s }\n' \
    "$started" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$commit" "$dirty" "$passed" >.ci-local/last-run.json
}

# req:check (b) önceki adımların sonucunu okur; ardından sonuç req:check dahil yeniden yazılır (REQ-TST-006).
write_result
run "req-check" pnpm req:check
write_result
# Faz kapısı "art arda 3 yeşil koşu" ölçütü için geçmiş (REQ-TST-005).
cat .ci-local/last-run.json >>.ci-local/history.jsonl
cat .ci-local/last-run.json
exit "$failed"
