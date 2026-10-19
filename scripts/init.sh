#!/usr/bin/env bash
# `pnpm run setup` — temiz klondan tek komutla yerel ortam (§9.5). İdempotenttir.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Node $(node -v) · pnpm $(pnpm -v)"

if [ ! -f .env ]; then
  cp .env.example .env
  secret="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  sed -i.bak "s/^CURSOR_SECRET=.*/CURSOR_SECRET=${secret}/" .env && rm -f .env.bak
  key="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  sed -i.bak "s/^DATA_ENCRYPTION_KEY=.*/DATA_ENCRYPTION_KEY=${key}/" .env && rm -f .env.bak
  echo "▶ .env oluşturuldu (.env.example'dan; CURSOR_SECRET yerelde rastgele üretildi)"
fi

if ! docker info >/dev/null 2>&1; then
  echo "▶ Docker daemon çalışmıyor; başlatılmaya çalışılıyor…"
  (nohup dockerd >/tmp/dockerd.log 2>&1 &) || true
  for _ in $(seq 1 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
  docker info >/dev/null 2>&1 || { echo "✖ Docker başlatılamadı. Docker'ı kurun/başlatın."; exit 1; }
fi

# Mevcut .env'de sonradan eklenen değişkenler eksikse tamamla (idempotent).
for var in DATA_ENCRYPTION_KEY EMAIL_ADAPTER MAILPIT_URL EMAIL_FROM WEB_BASE_URL ADMIN_BASE_URL; do
  if ! grep -q "^${var}=" .env; then
    if [ "$var" = DATA_ENCRYPTION_KEY ]; then
      echo "DATA_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
    else
      grep "^${var}=" .env.example >> .env
    fi
    echo "▶ .env'e eklendi: ${var}"
  fi
done

echo "▶ Bağımlılıklar kuruluyor"
pnpm install --frozen-lockfile

echo "▶ Yerel servisler (PostGIS, S3, e-posta yakalayıcı)"
docker compose -f infra/docker-compose.yml up -d --wait

echo "▶ Prisma istemcisi, paketler ve API derleniyor"
pnpm --filter @incelemeler/api prisma:generate
pnpm turbo run build --filter=@incelemeler/api --filter=@incelemeler/web --filter=@incelemeler/admin

echo "▶ Migration'lar"
pnpm db:migrate

echo "▶ Başlangıç verisi (taksonomi, arama sözlüğü, demo listelemeler; üretimde çalışmaz)"
pnpm seed:demo
pnpm search:reindex

echo "✔ Hazır. Geliştirme için: pnpm dev   ·   Doğrulama: pnpm verify"
