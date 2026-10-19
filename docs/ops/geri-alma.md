# Runbook: Sürüm geri alma ve migration güvenliği (REQ-OPS-004, REQ-VER-022) — TASLAK

## İlke
- Migration'lar **yalnızca ileri** ve **geriye uyumlu**dur: bir önceki uygulama sürümü yeni şemayla çalışabilmelidir.
  Bu nedenle geri alma = **önceki imaja dönmek**; şema geri alınmaz.
- Yıkıcı değişiklik **genişlet/daralt** ile yapılır: (1) yeni sütun/tablo eklenir, uygulama ikisine birden yazar;
  (2) veri taşınır; (3) sonraki sürümde okuma yenisine geçer; (4) en az bir sürüm sonra eski yapı ADR'li ayrı
  migration'la (`-- migration-safety: ADR-XXXX gerekçe`) kaldırılır. `pnpm migration:check` işaretsiz yıkıcı DDL'i reddeder.

## Geri alma adımları
1. Karar: hata oranı artışı, kritik akış bozuk ya da veri bütünlüğü riski → geri al (olay sorumlusu karar verir).
2. Gerekirse önce ilgili işletim anahtarını kapat (panel › İşletim anahtarları): ör. değerlendirme gönderimi, sponsorlu.
3. API/işçi/web/panel'i önceki etiketli imaja yuvarlanarak döndür.
4. `/v1/health` ve duman testi ([dagitim.md](dagitim.md) adım 6).
5. Olay kaydı aç ([olay-mudahale.md](olay-mudahale.md)); sebep bulunmadan yeniden dağıtma.

## Veri bozulması şüphesi
- Uygulama geri alınır; veri düzeltmesi yeni, gözden geçirilmiş bir migration ya da betikle yapılır. Zaman noktasına
  geri dönüş (PITR) son çaredir ve veri kaybı doğurur — [veritabani-geri-yukleme.md](veritabani-geri-yukleme.md), İnsan onayı (C).
