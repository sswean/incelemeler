# Runbook: Veritabanı geri yükleme ve tatbikat (REQ-OPS-005) — TASLAK

Hedefler (varsayılan, B sınıfı): **RPO ≤ 15 dk, RTO ≤ 4 saat.** Yönetilen veritabanı otomatik yedek + zaman noktasına
geri dönüş (PITR); yedekler şifreli ve ayrı hesap/bölgede (barındırma kararı Q-005, ADR-0014).

## Tatbikat (her faz kapısında)
- **Yerel (staging yokken):** `pnpm restore:drill` — `pg_dump` (özel biçim) → boş veritabanına `pg_restore` →
  `prisma migrate status` güncel → kritik tablolarda satır sayısı eşitliği. Sonuç ve süreler `.ci-local/restore-drill.json`;
  faz raporuna eklenir.
- **Staging:** MQA-005 (X-002 sağlanınca).

## Gerçek geri yükleme (C sınıfı — İnsan onayı)
1. Bakım modunu aç (panel › İşletim anahtarları) — yazma trafiği durur.
2. Geri dönülecek zamanı belirle (olaydan hemen önce); kayıp olacak veri penceresini not et.
3. Sağlayıcı PITR ile **yeni** bir veritabanı örneğine geri yükle (mevcut örneğin üzerine yazma).
4. Yeni örnekte `prisma migrate status` ve duman sorguları; `db:roles` çalıştır.
5. Uygulamanın `DATABASE_URL`'ünü yeni örneğe çevir (sırlar yöneticisinden), yuvarlanarak yeniden başlat.
6. Bakım modunu kapat; olay kaydına RPO/RTO gerçekleşen değerlerini yaz.
7. Kişisel veri etkileniyorsa [veri-ihlali.md](veri-ihlali.md).
