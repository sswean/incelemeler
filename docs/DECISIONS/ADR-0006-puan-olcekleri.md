# ADR-0006: Puan ölçekleri
- Durum: Kabul edildi (B sınıfı; Q-001 ile İnsan değiştirebilir) · Tarih: 2026-10-19 · İlgili: Ç-7, Ek A6.1–A6.2

## Karar
Kullanıcı puanı 1–5 tam yıldız; editör puanı 0–10, 0,5 adım. İkisi asla birleştirilmez. Ortalama n ≥ 3'te, dağılım n ≥ 5'te gösterilir; sıralamada Bayes ortalaması (C=10). Uygulama: `packages/utils/src/rating.ts` (birim testli).
