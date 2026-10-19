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

passed=$([ "$failed" -eq 0 ] && echo true || echo false)
cat > .ci-local/last-run.json <<JSON
{ "startedAt": "$started", "finishedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "commit": "$commit", "uncommittedFiles": $dirty, "passed": $passed }
JSON
run "req-check" pnpm req:check
cat .ci-local/last-run.json
exit "$failed"
