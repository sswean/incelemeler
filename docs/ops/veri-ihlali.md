# Runbook: Kişisel veri ihlali (REQ-KVK-024) — TASLAK

Ayrıntılı plan: [../legal/ihlal-mudahale-plani.md](../legal/ihlal-mudahale-plani.md) (TASLAK; bildirim süreleri ve
yükümlülükler hukukçu tarafından doğrulanacak — yasa maddesi burada yorumlanmaz).

## Adımlar
1. Panel › Hukuki/KVKK: ihlal kaydı oluştur (`POST /v1/admin/breaches`): tespit zamanı, özet, veri kategorileri.
   Kayıt denetim kaydına girer.
2. İhlali durdur: ilgili sırları döndür ([sir-rotasyonu.md](sir-rotasyonu.md)), gerekirse bakım modu.
3. Etki analizi: etkilenen kişi sayısı ve veri kategorileri (log ve veritabanından; maskeli loglar).
4. Hukukçu ve veri sorumlusu temsilcisi bilgilendirilir; Kurula ve ilgili kişilere bildirim kararı ve metni **İnsan**
   tarafından verilir (C sınıfı — gerçek kişilere ileti).
5. Kayıt güncellenir (aşama, bildirim zamanları); önleyici eylemler LESSONS'a.
