# Durum (STATUS)

- **Aktif faz: 0** — Temel ve yürüyen iskelet
- Aktif dilim: Faz 0 kapanışı (rapor: `docs/status-log/FAZ-0-raporu.md`)
- Son yeşil `ci:local`: bkz. `.ci-local/last-run.json` (yerel; git dışı)
- Dal: `claude/pensive-hopper-oftszn` (A-001)

## Açık engeller
- Q-003 (C): izin listesi dışı dolaylı lisanslar — İnsan onayı.
- Q-005 (C): barındırma/veri yerleşimi — staging/üretim yok.
- X-031: gerçek CI çalıştırıcısı doğrulanmadı → `pnpm ci:local`.

## Sonraki 3 adım (Faz 1, §9.3 önerilen sıra)
1. Dilim 1 — Kimlik + roller + denetim kaydı yazımı (ADR-0003): üyelik, e-posta doğrulama, oturum çerezi, CSRF, personel TOTP 2FA, rol × izin matrisi testleri (REQ-HSP-001…009, E2E-011).
2. Dilim 2 — Taksonomi yönetimi: kategori/özellik şeması CRUD (panel), outbox (ADR-0010), yayın eşikleri (REQ-KAT-001…005, E2E-018).
3. Dilim 3 — Listeleme CRUD + tür uzantıları + medya hattı + toplu içe aktarma (REQ-LST-*, REQ-VER-002…014).
