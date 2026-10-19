# Faz 0 raporu — Temel ve yürüyen iskelet

Tarih: 2026-10-19 · Dal: `claude/pensive-hopper-oftszn` · Kanıt commit'i: `61b353d` (+ bu raporun commit'i)

## 1. Sonuç ve İnsan'dan istenen karar
Monorepo, API, web, yönetim paneli, paylaşılan paketler, yerel servisler, testler ve yerel CI kuruldu. Web → API → PostgreSQL arasında gerçek okuma yapan yürüyen iskelet çalışıyor. Faz 0 → Faz 1 geçişi onay beklemez (§8.1); Faz 1'e geçiyorum. **Senden istenen:** Q-001/Q-002 varsayılanlarına itirazın varsa bildir; Q-003 (lisans istisnaları) ve Q-005 (barındırma/veri yerleşimi) için karar ver.

## 2. Faz 0 Bitti Tanımı
| Madde | Durum | Kanıt |
|---|---|---|
| Temiz klondan ≤ 3 komutla ayağa kalkar | TAMAM | Geçici dizine `git clone` → `pnpm run setup` (exit 0, 18 sn; 2. çalıştırma da exit 0 = idempotent) → `pnpm verify` (exit 0, 23 sn) |
| `pnpm verify` yerelde ve CI'da yeşil | Yerelde TAMAM · CI **DOĞRULANAMADI (CI yok)** | `pnpm ci:local` 3 ardışık koşu + 1 önbelleksiz koşu (`TURBO_FORCE=true`) exit 0. GitHub Actions çalıştırıcısı doğrulanmadı (X-031, MQA-001) |
| §10 hafıza dosyaları mevcut ve dolu | TAMAM | `AGENTS.md`, `CLAUDE.md`, `docs/*` |
| Faz 1 REQ'leri `requirements.json` içinde | TAMAM | 285 REQ aktarıldı (faz 0: 8, 1: 240, 2: 26, 3: 10, 4: 1) |
| Engelleyici sorular varsayılanlarıyla | TAMAM | `docs/OPEN-QUESTIONS.md` Q-001…Q-005 |

## 3. REQ özeti (Faz 0 ZORUNLU: 8)
| REQ | Durum | Not |
|---|---|---|
| REQ-MIM-001 DB yalnızca API'de | TAMAM | dependency-cruiser kuralı; ihlal probe ile yakalandı |
| REQ-MIM-002 contracts izomorfik | TAMAM | dependency-cruiser kuralı; probe ile doğrulandı |
| REQ-MIM-003 mimari dokümanlar | TAMAM | `docs/architecture/README.md`, ADR-0001…0010 |
| REQ-VER-001 listeleme ortak alanları | TAMAM | Migration + CHECK kısıtları + 4 entegrasyon testi |
| REQ-TST-001 test araçları | TAMAM | ADR-0008 |
| REQ-GUV-013 tedarik zinciri | KISMİ | Audit, gitleaks, lisans denetimi ve lockfile var; SAST ve imaj taraması Faz 1; lisans istisnaları Q-003 |
| REQ-OPS-001 ortamlar | KISMİ | Yerel + CI tanımı var; staging/üretim Q-005 (X-002) |
| REQ-OPS-002 CI aşamaları | KISMİ | `.github/workflows/ci.yml` + `ci:local`; gerçek çalıştırıcı X-031 |

Ayrıca 20 Faz 1 REQ'i Faz 0 sırasında **KISMİ** karşılandı (ör. RFC 9457 hatalar, imzalı cursor, Türkçe slug/normalizasyon, puan eşikleri, token kontrastı, axe denetimi). Ayrıntılar `requirements.json` dosyasındaki `notes` alanında.

## 4. Test özeti (bu oturumda, önbelleksiz koşu)
| Katman | Sonuç |
|---|---|
| Birim (Vitest) | 88 geçti, 0 kaldı, 0 atlandı (utils 33, tokens 34, api 13, contracts 5, i18n 2, api-client 1) |
| Entegrasyon (Testcontainers PostGIS) | 13 geçti |
| E2E (Playwright, 390×844 + 1280×800) | 10 geçti (5 senaryo × 2 görünüm) |
| Lint / deps / typecheck / format / build / OpenAPI fark | Yeşil |
| Lisans | Yeni ihlal yok; 18 dolaylı istisna onay bekliyor (Q-003) |
| `pnpm audit --prod --audit-level=high` | Bilinen açık yok |
| gitleaks (tüm geçmiş) | Sızıntı yok |

## 5. Temiz klon testi
```
git clone <repo> /tmp/.../clean
pnpm run setup   # exit 0 (ikinci çalıştırma da exit 0)
pnpm verify      # exit 0
```

## 6. Performans ve erişilebilirlik
- axe: ana sayfada ciddi/kritik ihlal 0 (iki görünüm alanı).
- Lighthouse CI ve API yük testi Faz 1'de kurulacak; laboratuvar ölçümü henüz yok.

## 7. MOCK / DEMO / DOĞRULANAMADI
- MOCK yok. DEMO veri yok. Seed yalnızca platform taksonomisini (EDITORIAL) yükler ve üretimde çalışmayı reddeder (testli).
- DOĞRULANAMADI: gerçek CI çalıştırıcısı (MQA-001), staging/üretim ayrımı (MQA-002).

## 8. Bekleyen hukuki ve dış bağımlılıklar
- L-001…L-025 tümü AÇIK · DOĞRULANMADI (`docs/LEGAL-REVIEW.md`).
- X-001…X-031 tümü BEKLİYOR (`docs/EXTERNAL-DEPENDENCIES.md`).

## 9. Yüksek geri alma maliyetli varsayımlar ve B sınıfı varsayılanlar
- ADR-0003 (kendi kimlik doğrulama modülümüz): Yüksek. Faz 1 dilim 1'de uygulanacak.
- ADR-0004 (hibrit veri modeli): Yüksek. Kabul edildi.
- B sınıfı varsayılanlar: puan ölçekleri ve "sen" hitabı (Q-001), pilot dikeyler ve şehirler (Q-002).

## 10. Bağımsız doğrulama
Faz 0 için ayrı bağlamlı doğrulayıcı çalıştırılmadı (§12.6 "her 5 dilimde bir ve faz kapısından önce" kuralı Faz 1 kapısı için uygulanacak). Faz 0 kapısı İnsan onayı gerektirmediğinden bu adım ertelendi.

## 11. Sonraki faz için öneri ve riskler
- Faz 1 dilim sırası §9.3: (1) kimlik + roller → (2) taksonomi yönetimi + outbox → (3) listeleme + medya + içe aktarma → …
- Riskler: NestJS 12 ESM ekosistem uyumu (ör. kimlik kütüphaneleri); Prisma 7 + PostGIS kolonlarında ham SQL ihtiyacı; `sharp` lisans kararı (Q-003) görsel hattını etkiler; CI çalıştırıcısının doğrulanmaması.

## 12. Demo betiği
`docs/demos/FAZ-0.md`
