# Dağıtım kontrol listesi

> Üretime dağıtım C sınıfıdır (İnsan onayı). Bu liste onay öncesi gözden geçirilir.

| # | Madde | Nasıl doğrulanır | Durum |
|---|---|---|---|
| 1 | `pnpm ci:local` (ya da gerçek CI) son commit'te yeşil | `.ci-local/last-run.json` | — |
| 2 | **Hukuki metinler onaylı:** `legal_document_versions` içinde yürürlükteki her sürümün `approved_by` alanı dolu. Boşsa sayfada TASLAK uyarısı görünür ve bu madde **KIRMIZI**dır (REQ-KVK-004). | `SELECT doc_type, version FROM legal_document_versions WHERE approved_by IS NULL` boş olmalı | 🔴 KIRMIZI (tüm metinler TASLAK) |
| 3 | Demo veri üretime girmez (AK-03) | `pnpm seed:demo` üretimde reddeder; `data_origin='DEMO'` sayısı 0 | — |
| 4 | MOCK adaptör üretimde kapalı (AK-06) | ortam doğrulaması açılışta reddeder | — |
| 5 | `SITE_INDEXING` yalnızca canlıya geçiş onayıyla açık | ortam değişkeni | — |
| 6 | Saklama/imha süreleri hukuken doğrulandı (REQ-KVK-023) | `docs/legal/saklama-imha-politikasi.md` TASLAK değil | 🔴 KIRMIZI |
| 7 | API en az yetkili rolle bağlanır (REQ-GUV-011) | `db:roles` çalıştırıldı; `DATABASE_URL` kullanıcısı `incelemeler_app`, migration'lar `MIGRATION_DATABASE_URL` ile; `SELECT rolsuper FROM pg_roles WHERE rolname = current_user` → false | — |
| 8 | Hız sınırı çarpanı 1 (REQ-GUV-009) | `RATE_LIMIT_MULTIPLIER` tanımsız ya da 1 (üretimde başka değer açılışı reddeder) | — |
