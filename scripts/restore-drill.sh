#!/usr/bin/env bash
# `pnpm restore:drill` — yerel geri yükleme tatbikatı (REQ-OPS-005; staging varsa orada, MQA-005):
# yedek al (pg_dump, özel biçim) → boş veritabanına geri yükle → migration durumu → satır sayısı karşılaştırması.
# Komutlar ve süreler `.ci-local/restore-drill.json`'a yazılır (faz raporuna eklenir). Yalnızca yerel Docker ortamı.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC_DB="${SRC_DB:-incelemeler}"
DRILL_DB="incelemeler_restore_drill"
PGUSER_LOCAL="incelemeler"
container="$(docker ps --format '{{.Names}}' | grep -m1 postgres)"
mkdir -p .ci-local
dump=".ci-local/restore-drill.dump"
psql_in() { docker exec -i "$container" psql -U "$PGUSER_LOCAL" -v ON_ERROR_STOP=1 -At "$@"; }
now() { date +%s.%N; }

t0=$(now)
docker exec "$container" pg_dump -U "$PGUSER_LOCAL" -Fc "$SRC_DB" >"$dump"
t1=$(now)
psql_in -d postgres -c "DROP DATABASE IF EXISTS $DRILL_DB WITH (FORCE)" >/dev/null
psql_in -d postgres -c "CREATE DATABASE $DRILL_DB" >/dev/null
docker exec -i "$container" pg_restore -U "$PGUSER_LOCAL" -d "$DRILL_DB" --no-owner <"$dump"
t2=$(now)

# Migration durumu: geri yüklenen şema güncel olmalı (ileri migration uygulanabilir).
status="$(cd apps/api && DATABASE_URL="postgresql://$PGUSER_LOCAL:incelemeler_local_only@localhost:54320/$DRILL_DB" \
  npx prisma migrate status 2>&1 | tail -1)"
t3=$(now)

# Duman testi: kritik tablolarda satır sayıları kaynakla aynı.
tables="users listings reviews categories audit_log campaigns consent_records"
mismatch=""
for tb in $tables; do
  a="$(psql_in -d "$SRC_DB" -c "SELECT count(*) FROM $tb")"
  b="$(psql_in -d "$DRILL_DB" -c "SELECT count(*) FROM $tb")"
  [ "$a" = "$b" ] || mismatch="$mismatch $tb($a≠$b)"
done
size="$(stat -c %s "$dump")"
psql_in -d postgres -c "DROP DATABASE $DRILL_DB WITH (FORCE)" >/dev/null
rm -f "$dump"

ok=true
[ -z "$mismatch" ] || ok=false
case "$status" in *"up to date"*) ;; *) ok=false ;; esac
printf '{ "at": "%s", "source": "%s", "dumpBytes": %s, "backupSeconds": %.1f, "restoreSeconds": %.1f, "migrateStatusSeconds": %.1f, "migrateStatus": "%s", "rowCountMismatch": "%s", "passed": %s }\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$SRC_DB" "$size" "$(echo "$t1-$t0" | bc)" "$(echo "$t2-$t1" | bc)" \
  "$(echo "$t3-$t2" | bc)" "$status" "${mismatch# }" "$ok" | tee .ci-local/restore-drill.json
$ok
