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

Bu depo, web sürümünü bozmamak için Capacitor yapılandırmasını içerir. Android/iOS klasörleri mağaza hesabı açılmadan hemen önce, geliştirici bilgisayarında aşağıdaki sırayla üretilecektir:

```bash
pnpm add @capacitor/core @capacitor/app @capacitor/browser @capacitor/camera @capacitor/device @capacitor/filesystem @capacitor/haptics @capacitor/keyboard @capacitor/network @capacitor/preferences @capacitor/push-notifications @capacitor/share @capacitor/splash-screen @capacitor/status-bar
pnpm add -D @capacitor/cli @capacitor/android @capacitor/ios
pnpm run build
pnpm exec cap add android
pnpm exec cap add ios
pnpm exec cap sync
```

> iOS projesi yalnızca macOS + Xcode üzerinde derlenebilir. Android için Android Studio gerekir.

## Mağaza öncesi tamamlanacaklar

- [x] Gizlilik Politikası sayfası
- [x] Kullanım Koşulları sayfası
- [x] KVKK Aydınlatma sayfası
- [x] Herkese açık hesap silme adresi
- [x] Uygulama içinden hesap silme
- [x] Kullanıcı verilerini indirme
- [x] Şifre değiştirme
- [x] Çevrimdışı bağlantı uyarısı
- [x] PWA manifesti
- [x] Capacitor yapılandırması
- [ ] Resmî işletme unvanı/adresi/e-postası ile yasal sayfaların son kontrolü
- [ ] E-posta doğrulama ve şifre sıfırlama sağlayıcısı
- [ ] Android/iOS native klasörlerinin üretilmesi
- [ ] Firebase/APNs push bildirim anahtarları
- [ ] Kamera, fotoğraf yükleme ve paylaşım native testleri
- [ ] 1024×1024 mağaza ikonu ve splash görselleri
- [ ] Telefon/tablet ekran görüntüleri
- [ ] Anthropic kredisi ve canlı AI testi
- [ ] Fiziksel Android/iPhone/iPad testleri
- [ ] Google Play kapalı test ve TestFlight

## Uygulama inceleme hesabı

Mağaza incelemesi öncesinde ayrı bir test müşteri hesabı oluşturulmalıdır. Test hesabının şifresi gerçek yönetici şifresi olmamalıdır. İnceleme notlarında şu akış açıklanacaktır:

1. Test hesabıyla giriş.
2. Fiyat hesaplama.
3. Sipariş oluşturma.
4. Hesabım ekranında sipariş takibi.
5. Hesap Ayarları ekranında veri indirme ve hesap silme yolu.

## Güvenlik notları

- API anahtarları uygulama paketine yazılmaz; yalnızca Hostinger sunucusunda tutulur.
- Yönetici şifresi mobil uygulamaya gömülmez.
- Kullanıcı şifreleri `scrypt` özeti olarak saklanır.
- Kamera, fotoğraf ve bildirim izinleri yalnızca ilgili özellik açıldığında istenir.
- Yapay zekâ özelliği kullanılamıyorsa bakım mesajı gösterilir; sahte demo yanıt üretilmez.
