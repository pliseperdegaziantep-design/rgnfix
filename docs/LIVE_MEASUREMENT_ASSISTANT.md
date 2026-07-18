# RGNFIX Canlı Ölçü Asistanı

## Değiştirilen ve eklenen dosyalar

### `client/src/pages/MeasurementAssistant.tsx`

Canlı ölçü akışının ana ekranıdır.

- Ölçüye başlamadan önce kayıt yöntemi seçilir.
- Çelik metre zorunluluğu gösterilir.
- Yedi uygulama alanı ayrı ayrı seçilebilir.
- PVC ve alüminyum sistemlerde kancalı montaj gösterilmez.
- Cam balkonda ilk açılan kanat bulunmadan ölçü aşamasına geçilmez.
- Toplam kanat/parça sayısı kadar ayrı ölçü istenir.
- Her parçada EN, BOY ve ikinci BOY kontrolü zorunludur.
- Aynı ölçü tekrar girildiğinde kullanıcıdan ayrı ölçtüğünü onaylaması istenir.
- Son onay kutuları tamamlanmadan fiyat hesaplamaya aktarım yapılamaz.
- Ölçü listesi indirilebilir ve WhatsApp’a gönderilebilir.
- Ölçü fotoğrafı cihaz paylaşım menüsü üzerinden WhatsApp’a gönderilebilir.

### `client/src/features/live-measurement/rules.ts`

Yapay zekâdan bağımsız kesin matematik modülüdür.

- Santimetre girişinde nokta ve virgül kabul edilir.
- En fazla bir ondalık basamak kabul edilerek 1 mm hassasiyet korunur.
- Ölçüler aşağı veya yukarı yuvarlanmaz.
- İlk açılan cam balkon kanadının yalnızca eninden 2 cm düşülür.
- İlk açılan kanadın boyundan pay düşülmez.
- Normal cam balkon kanatlarında pay sıfırdır.
- PVC ve alüminyum sistemlerde bütün paylar sıfırdır.
- Montaj uygunluğu matematiksel sabitlerle doğrulanır.
- Fiyat hesaplamaya her kanadın üretim ölçüsü ayrı satır olarak hazırlanır.

### `client/src/features/live-measurement/LiveMeasurementCamera.tsx`

Kamera üzerinden görsel hizalama bileşenidir.

- Kamera görüntüsünden santimetre veya üretim ölçüsü hesaplanmaz.
- Yatay EN ve dikey BOY yön çizgileri gösterilir.
- Başlangıç ve bitiş noktaları görsel olarak işaretlenir.
- Kamera ekranında sürekli olarak ölçünün çelik metreden okunması gerektiği belirtilir.
- Ölçü fotoğrafı çekilebilir.

### `client/src/pages/PriceCalculator.tsx`

Ölçü asistanından gelen bütün üretim ölçülerini ayrı satırlar olarak yükler.

- İlk açılan kanatta 2 cm düşülmüş üretim eni aktarılır.
- Diğer kanatlarda net ölçü aynen aktarılır.
- Mevcut fiyat hesaplama sistemi korunur.
- Fiyatlama için mevcut 5’lik yuvarlama ve minimum 1 m² kuralı çalışmaya devam eder.
- PVC ve alüminyum uygulama alanlarında kancalı montaj fiyat ekranında da gizlenir.

### `client/src/features/live-measurement/rules.test.ts`

Kesin kuralları otomatik olarak test eder.

- Virgüllü ölçü girişi
- Küsuratın korunması
- İlk açılan kanatta `-2 cm`
- Normal kanatta sıfır pay
- PVC ve alüminyumda sıfır pay
- PVC ve alüminyumda kancalı montaj yasağı

### `.github/workflows/build.yml`

Her güncellemede şu kontrolleri çalıştırır:

1. TypeScript kontrolü
2. Matematiksel ölçü kuralı testleri
3. Üretim build kontrolü

## Değiştirilemez kurallar

1. Kamera ölçü hesaplamaz.
2. Yapay zekâ santimetre tahmin etmez.
3. Müşterinin net ölçüsü sessizce değiştirilmez.
4. Müşteri ilk açılan kanattan kendisi 2 cm düşmez.
5. Yalnızca ilk açılan cam balkon kanadının eninden sistem 2 cm düşer.
6. Hiçbir boy ölçüsünden pay düşülmez.
7. Normal cam balkon kanatlarında pay düşülmez.
8. PVC ve alüminyum sistemlerde pay düşülmez.
9. PVC ve alüminyum sistemlerde kancalı montaj gösterilmez.
10. Her cam ayrı ayrı ölçülür.
11. İki farklı boy ölçümünün ortalaması alınmaz.
12. Fiyat hesabı mevcut matematiksel fiyat koduyla yapılır.
