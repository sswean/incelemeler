# Varsayımlar (ASSUMPTIONS)

Biçim: Ek C-4. "Yüksek" geri alma maliyetli varsayımlar OPEN-QUESTIONS'ta da yer alır.

## A-001: Geliştirme `claude/pensive-hopper-oftszn` dalında yapılır
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Oturumun yetkili dal talimatı; prompt §9.4'teki `feat/*` dal modeli, `main`'e birleştirme PR'larıyla başladığında uygulanacak.
- Etkilediği REQ'ler: — · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-002: Kullanıcı puanı 1–5 tam yıldız, editör puanı 10 üzerinden 0,5 adımlı
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Ç-7 varsayılanı; `packages/utils/src/rating.ts`.
- Etkilediği REQ'ler: REQ-DEG-001, REQ-VER-005/006 · Geri alma maliyeti: Orta · Durum: AÇIK (Q-001)

## A-003: Pilot dikeyler Mekan (yeme-içme), Konaklama, Ürün (teknoloji) + destinasyon sayfaları; lansman şehirleri İstanbul, İzmir, Antalya, Muğla, Nevşehir
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §7.2 varsayılanı.
- Etkilediği REQ'ler: Faz 1 LST/ARA/SEO · Geri alma maliyeti: Orta · Durum: AÇIK (Q-002)

## A-004: Arayüz hitabı "sen"
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §4.3 varsayılanı; `packages/i18n`.
- Geri alma maliyeti: Düşük · Durum: AÇIK (Q-001)

## A-005: TypeScript 6.0.3 (en güncel 7.0.2 değil)
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: typescript-eslint 8.71 TypeScript `<6.1` destekliyor; TS 7 ile lint zinciri çalışmaz (ADR-0001).
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-006: Arka plan işleri için Redis/BullMQ yok; gerekirse önce PostgreSQL kuyruğu
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: §14.4 tetikleyicileri henüz ölçülmedi.
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-007: Başlangıç taksonomisi yayında (PUBLISHED) yüklenir
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Yürüyen iskeletin gerçek veri okuması için. Yayın eşikleri (§7.2) listeleme ve hub sayfalarına Faz 1'de uygulanacak; eşik altı kategoriler o zaman menü ve site haritasından gizlenecek (REQ-KAT-003).
- Etkilediği REQ'ler: REQ-KAT-003 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-008: Web ve panel geliştirme sürümünde `noindex`
- Tarih: 2026-10-19 · Faz 0 · Gerekçe: Canlıya geçiş C sınıfı; erken indekslenmeyi önler.
- Geri alma maliyeti: Düşük · Durum: AÇIK

## A-009: İstemci IP'si web/panelden `X-Forwarded-For` ile API'ye iletilir; üretimde başlığı güvenilen uç vekil ekler
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: IP başına hız sınırları (REQ-HSP-008) web sunucusunun değil son kullanıcının IP'siyle çalışmalı. API yalnız loopback vekile güvenir (`TRUST_PROXY`) ve en sağdaki güvenilmeyen adresi kullanır; uç vekil (X-003) başlığa gözlediği IP'yi eklemezse istemci başlığı taklit edebilir. Gereksinim X-003 kaydına not düşüldü.
- Etkilediği REQ'ler: REQ-HSP-008, REQ-GUV-009 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-010: CSRF koruması ilk sürümde SameSite çerez + Next Server Actions Origin/Host denetimi
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: Durum değiştiren tüm web/panel istekleri Server Action (yalnız POST, Next Origin ≠ Host ise reddeder); API çerez kabul etmez. Çift gönderim token'ı D13 sertleştirmede eklenecek.
- Etkilediği REQ'ler: REQ-HSP-004, REQ-GUV-006 · Geri alma maliyeti: Düşük · Durum: AÇIK

## A-011: YMYL ve lisanslı kategorilerde sponsorluk Faz 1'de kapalı tutulur; yayımlanmış kategorinin slug'ı değişmez
- Tarih: 2026-10-19 · Faz 1 · Gerekçe: REQ-KAT-004 "sponsorluk varsayılan kapalı" der; açma yolu hukuki kapı (C sınıfı) olduğundan API ve veritabanı (CHECK) bu kategorilerde sponsorluğu reddeder. Slug değişikliği SEO yönlendirme kaydı gerektirir (D4); o zamana dek kilitli.
- Etkilediği REQ'ler: REQ-KAT-003/004, REQ-SPN-* · Geri alma maliyeti: Düşük · Durum: AÇIK
