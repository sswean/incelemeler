# Veri İhlali Müdahale Planı — TASLAK

> **TASLAK (AK-12).** Hukuki incelemeden geçmemiştir. Bildirim süreleri ve bildirim yükümlülüğünün kapsamı
> `compliance_config`'ten okunacak ve bir hukukçu tarafından doğrulanacaktır. Kuruma ya da ilgili kişilere bildirim
> yapmak dışa dönük ve geri alınamaz bir işlemdir: **C sınıfı — İnsan onayı** (AK-09).

## Adımlar
1. **Tespit:** olay kaydı açılır (`breach_incidents`, panel API'si `/v1/admin/breaches`): tespit zamanı, özet,
   etkilenen veri kategorileri, tahmini kişi sayısı.
2. **Sınırlama:** erişimin kesilmesi, kimlik bilgilerinin döndürülmesi, etkilenen oturumların kapatılması.
3. **Etki analizi:** hangi veri, kaç kişi, hangi süre; risk değerlendirmesi.
4. **Bildirim kararı:** yükümlülük ve süre hukukçuyla birlikte değerlendirilir; karar ve gerekçesi kayda yazılır.
5. **İlgili kişilere bildirim:** gerekiyorsa sade dille, ne olduğu ve ne yapmaları gerektiği.
6. **Kök neden ve önlemler:** düzeltici eylemler, LESSONS kaydı.

## Tatbikat
Yılda en az bir masa başı tatbikatı; tatbikat kayıtları "Tatbikat" ibaresiyle açılır.

## Roller
Olay sorumlusu, teknik sorumlu, hukuk danışmanı, iletişim sorumlusu: **belirlenecek** (İnsan).
