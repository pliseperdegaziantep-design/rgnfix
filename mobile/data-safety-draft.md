# Google Play Data Safety — Taslak

Bu dosya mağaza formuna aktarılmadan önce canlı uygulama ve kullanılan tüm SDK'larla tekrar doğrulanmalıdır.

## Toplanan veri türleri

| Veri | Toplanıyor | Kullanım amacı | Kullanıcı silebilir mi? |
|---|---:|---|---:|
| Ad soyad | Evet | Hesap ve sipariş | Evet |
| E-posta | Evet | Giriş, hesap desteği | Evet |
| Telefon | Evet | Sipariş ve teslimat iletişimi | Evet |
| Adres/şehir | Evet | Teslimat | Evet |
| Sipariş ve ürün tercihleri | Evet | Siparişin yürütülmesi | Kısmen; yasal kayıt süresi saklı |
| Ölçü bilgileri | Evet | Ürün üretimi ve hesaplama | Evet |
| Kullanıcı mesajları | AI kullanılırsa | Danışman yanıtı | Hesap/veri talebiyle |
| Fotoğraf/kamera | Kullanıcı seçerse | Ölçü ve destek | Evet |
| Cihaz/bildirim belirteci | Bildirim açılırsa | Sipariş bildirimleri | Evet |
| Hata ve güvenlik kayıtları | Evet | Güvenlik ve hata giderme | Saklama süresine göre |

## Paylaşım

- Barındırma ve veritabanı sağlayıcısı
- Kargo/teslimat sağlayıcısı
- Bildirim hizmeti
- Kullanıcı AI özelliğini açarsa yapay zekâ hizmet sağlayıcısı
- Yasal zorunluluk hâlinde yetkili kurumlar

## Güvenlik beyanı

- Aktarım HTTPS ile şifrelenir.
- Şifreler düz metin olarak saklanmaz.
- Kullanıcı, uygulama içinden ve `https://rgnfix.com/hesap-silme` adresinden hesap silme yoluna erişebilir.
- Kullanıcı verilerini JSON olarak indirebilir.

## Reklam

Mevcut sürümde üçüncü taraf reklam SDK'sı planlanmamıştır. Reklam SDK'sı eklenirse bu dosya ve mağaza beyanı güncellenmelidir.

## Finansal veri

Mevcut sipariş akışında uygulama içinde kart bilgisi toplanmaz. Ödeme sağlayıcısı eklenirse finansal veri beyanı yeniden düzenlenmelidir.
