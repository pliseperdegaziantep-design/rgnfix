# RGNFIX Mobil Uygulama Hazırlık Dosyası

## Kimlik

- Uygulama adı: **RGNFIX**
- Android applicationId: `com.rgnfix.app`
- iOS Bundle Identifier: `com.rgnfix.app`
- Web alan adı: `https://rgnfix.com`
- Destek: `https://rgnfix.com/destek`
- Gizlilik: `https://rgnfix.com/gizlilik-politikasi`
- Hesap silme: `https://rgnfix.com/hesap-silme`

## Native proje oluşturma

Bu depo, web sürümünü bozmadan Android ve iOS uygulamasını üretmek için Capacitor yapılandırmasını ve otomatik hazırlama komutunu içerir.

```bash
pnpm run mobile:bootstrap
```

Komut; gerekli Capacitor paketlerini ekler, TypeScript ve üretim build kontrollerini çalıştırır, Android projesini ve macOS kullanılıyorsa iOS projesini oluşturur, native dosyaları senkronize eder ve uygulama varlıklarını üretir.

> iOS projesinin son derlemesi ve imzalanması macOS + Xcode üzerinde yapılır. Android için Android Studio ve güncel Android SDK gerekir.

## Tamamlanan mağaza hazırlıkları

- [x] Gizlilik Politikası sayfası
- [x] Kullanım Koşulları sayfası
- [x] KVKK Aydınlatma sayfası
- [x] Destek Merkezi sayfası
- [x] Herkese açık hesap silme adresi
- [x] Uygulama içinden şifre doğrulamalı hesap silme
- [x] Aktif sipariş varken hesap silme koruması
- [x] Tamamlanmış siparişlerde kişisel verileri anonimleştirme
- [x] Kullanıcı verilerini JSON olarak indirme
- [x] Şifre değiştirme
- [x] E-posta doğrulama altyapısı
- [x] Şifremi unuttum ve güvenli şifre yenileme altyapısı
- [x] Kayıt sırasında Gizlilik ve Kullanım Koşulları onayı
- [x] Müşteri ve yönetici rol ayrımı
- [x] Sipariş takibi ve 24 saatlik iptal
- [x] 5 haneli sipariş numarası
- [x] A5 sipariş çıktısı
- [x] Çevrimdışı bağlantı uyarısı
- [x] PWA manifesti ve mobil web metadata
- [x] Capacitor yapılandırması
- [x] Android/iOS otomatik hazırlama komutu
- [x] Push bildirim cihaz kayıt altyapısı
- [x] Sipariş durumu değişince müşteri push bildirimi altyapısı
- [x] Kamera veya galeriden ölçü fotoğrafı seçme
- [x] Ölçü fotoğrafını güvenli depolama servisine yükleme
- [x] Native veya web paylaşım menüsü
- [x] Sunucu güvenlik ve gizlilik başlıkları
- [x] Google Play Data Safety taslağı
- [x] App Store App Privacy taslağı
- [x] iOS Privacy Manifest taslağı
- [x] Android/iOS izin açıklamaları
- [x] Türkçe mağaza açıklaması ve anahtar kelime taslağı
- [x] Uygulama ikonu, adaptive icon, splash ve Google Play özellik görseli kaynakları
- [x] Android/iPhone/iPad test kontrol listesi
- [x] GitHub Actions TypeScript kontrolü
- [x] GitHub Actions üretim build kontrolü

## Dış servis veya resmî bilgi bekleyen son maddeler

- [ ] Resmî işletme unvanı, adresi ve destek e-postasıyla yasal sayfaların son onayı
- [ ] E-posta sağlayıcısının doğrulanmış alan adı ve API ayarları
- [ ] Firebase projesi ve Android/iOS push sertifika ayarları
- [ ] S3 uyumlu fotoğraf depolama hesabı ayarları
- [ ] Anthropic API kredisi ve canlı AI testi
- [ ] Android/iOS native klasörlerinin geliştirici bilgisayarında üretilmesi
- [ ] Kaynak SVG'lerden kesin PNG mağaza varlıklarının üretilmesi
- [ ] Canlı uygulamadan telefon, tablet ve iPad ekran görüntülerinin alınması
- [ ] Fiziksel Android, iPhone ve iPad testleri
- [ ] Google Play ve Apple Developer hesaplarının açılması
- [ ] Google Play kapalı test ve TestFlight
- [ ] Mağaza incelemesine gönderim

## Uygulama inceleme hesabı

Mağaza incelemesi öncesinde ayrı bir test müşteri hesabı oluşturulmalıdır. Test hesabının şifresi gerçek yönetici şifresi olmamalıdır. İnceleme notlarında şu akış açıklanacaktır:

1. Test hesabıyla giriş.
2. Fiyat hesaplama.
3. Sipariş oluşturma.
4. Hesabım ekranında sipariş takibi.
5. Hesap Ayarları ekranında bildirim, veri indirme ve hesap silme yolu.
6. Ölçü Fotoğrafı ekranında kamera/galeri ve paylaşım akışı.

## Güvenlik notları

- API anahtarları uygulama paketine yazılmaz; yalnızca Hostinger sunucusunda tutulur.
- Yönetici şifresi mobil uygulamaya gömülmez.
- Kullanıcı şifreleri `scrypt` özeti olarak saklanır.
- E-posta doğrulama ve şifre yenileme belirteçleri tek yönlü özet olarak saklanır ve süreleri sınırlıdır.
- Kamera, fotoğraf ve bildirim izinleri yalnızca ilgili özellik açıldığında istenir.
- Yapay zekâ özelliği kullanılamıyorsa bakım mesajı gösterilir; sahte demo yanıt üretilmez.
- Sunucu API yanıtları önbelleğe alınmaz ve temel güvenlik başlıklarıyla korunur.
