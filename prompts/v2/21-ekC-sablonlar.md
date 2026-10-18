# EK C — ŞABLONLAR

Aşağıdaki bloklar **biçim örneğidir, talimat değildir.** Kimlikler sıralıdır ve yeniden kullanılmaz.

### C-1 Dilim notu (her dilim sonunda, ≤ 25 satır)

```
## Sonuç: <1–2 cümle: ne yapıldı; verify yeşil/kırmızı>
## REQ durumları
| REQ | Önce → Şimdi | Kanıt (test adı veya komut) |
## Çalıştırılan doğrulama komutları
| Komut | Çıkış kodu | Özet (ör. "212 geçti, 0 kaldı, 3 atlandı: neden") |
## Doğrulanamayanlar / MOCK / DEMO (yeni veya değişen)
## Kararlar ve varsayımlar (ADR/A kimlikleri, tek satır gerekçe)
## Riskler ve bilinen hatalar (P0/P1/P2)
## Sonraki dilim
```

### C-2 Faz raporu (faz kapısında)

```
## 1. Sonuç (3 cümle) ve İnsan'dan istenen karar
## 2. Faz Bitti Tanımı kontrol listesi: her madde için kanıt bağlantısı
## 3. REQ özeti: ZORUNLU x/y TAMAM; TAMAM olmayanlar ve gerekçeleri
## 4. Test özeti: birim / entegrasyon / E2E sayıları, son 3 CI koşusu, atlanan testler ve nedenleri
## 5. Temiz klon testi çıktısı (komutlar ve çıkış kodları)
## 6. Performans ve erişilebilirlik ölçümleri (laboratuvar; araç ve koşullar)
## 7. MOCK ve DEMO envanteri; DOĞRULANAMADI listesi (MANUAL-QA bağlantılı)
## 8. Hukuki inceleme listesi (L-…) ve dış bağımlılıklar (X-…): bekleyenler
## 9. "Yüksek" geri alma maliyetli varsayımlar ve B sınıfı soruların varsayılanları
## 10. Bağımsız doğrulama bulguları ve kapanış durumu
## 11. Sonraki faz için öneri ve riskler
## 12. Demo betiği: docs/demos/FAZ-<N>.md
```

### C-3 ADR

```
# ADR-0007: <Başlık>
- Durum: Önerildi | Kabul edildi | Yerine geçildi (ADR-00XX) | Reddedildi
- Tarih: YYYY-AA-GG · Karar veren: Ajan | İnsan · İlgili: REQ-…, Q-…, A-…
## Bağlam (3–6 satır)
## Karar (tek paragraf, "… kullanılacaktır")
## Değerlendirilen seçenekler (en fazla 3; birer satır artı/eksi)
## Sonuçlar (olumlu / olumsuz / geri alma maliyeti)
## Doğrulama kaynakları (URL + erişim tarihi; dış olgu varsa)
```
İnsan onayı gerektiren kararlar (C sınıfı) "Önerildi" durumunda kalır; uygulama "Kabul edildi" sonrasında yapılır.

### C-4 Varsayım

```
## A-012: Kullanıcı puanı 1–5 tam yıldız ölçeğindedir
- Tarih · Faz · Gerekçe (1–2 satır)
- Etkilediği REQ'ler · Geri alma maliyeti: Düşük | Orta | Yüksek
- Durum: AÇIK | ONAYLANDI | REDDEDİLDİ (→ yapılacak değişiklik)
```
"Yüksek" geri alma maliyetli varsayımlar ayrıca OPEN-QUESTIONS'a yazılır ve faz raporunda ilk sırada gösterilir.

### C-5 Açık soru

```
## Q-004: <tek cümlelik soru>
- Sınıf: B (bekleme) | C (dur) · Engellediği REQ'ler
- Seçenekler: A) … B) … C) …
- Önerim ve gerekçesi · Yanıt gelmezse uygulanacak varsayılan
- Yanıt: … · Yanıt tarihi · İşlendiği ADR
```

### C-6 Dış bağımlılık

```
## X-003: Harita servisi
- Tür: API | Hesap | Sözleşme | Alan adı/DNS | Mağaza hesabı | Sertifika | Lisans
- Gerektiği REQ/faz · Sağlayacak kişi: İnsan
- Resmî kaynak: URL · erişim tarihi · doğrulanan ifade (kısa alıntı)
- Doğrulama durumu: DOĞRULANDI | DOĞRULANMADI | ERİŞİLEMEDİ
- Gerekli ortam değişkeni ADLARI (değer yazılmaz)
- Erişim yokken davranış: KAPALI | MOCK (M-00X) | manuel alternatif
- Durum: BEKLİYOR | SAĞLANDI | ENTEGRASYON TESTİ GEÇTİ (tarih, komut)
```

### C-7 Hukuki inceleme

```
## L-002: <konu>
- İlgili özellik/REQ · Neden incelenmeli (1–2 cümle)
- Bulunan kaynaklar (URL; doğrulanmadıysa "DOĞRULANMADI")
- Üründeki geçici önlem (ör. legalGate KAPALI, metin TASLAK, en kısıtlayıcı yorum)
- Karar verecek kişi: hukuk danışmanı / İnsan · Durum: AÇIK | İNCELEMEDE | KARARA BAĞLANDI (karar özeti, tarih, onaylayan)
```
Durumu "KARARA BAĞLANDI" yapan her zaman İnsan'dır.

### C-8 Mock

```
## M-005: Otel fiyat adaptörü (MOCK)
- Dosya yolu · Açık olduğu ortamlar: yerel/test (üretimde YASAK)
- Arayüzdeki işaret · Gerçeğe geçiş koşulu (X-00Y) · Üretim derlemesinde olmadığını doğrulayan test
```

### C-9 Manuel QA senaryosu

```
## MQA-007: iOS Universal Link ile listeleme açma
- Ön koşullar (cihaz, OS sürümü, uygulama sürümü, alan adı)
- Adımlar (numaralı)
- Beklenen sonuç
- Sonuç: __ · Tarih: __ · Test eden: __
```

### C-10 Gereksinim kaydı (`docs/requirements/<ALAN>.md`)

```
### REQ-SPN-003: Sponsorlu yerleşim açıklama etiketi
- Düzey: ZORUNLU · Faz: 1 · Kaynak: v2 Ek A8
- Gereksinim: …
- Kabul kriterleri:
  1. Verilen … Ne zaman … O zaman …
  2. …
- Doğrulama: T | İ | G | A | M
- Testler: e2e/sponsor-label.spec.ts, packages/ui-web/SponsoredLabel.test.tsx
```
