# RGNFIX Android ve iOS İzinleri

Uygulama yalnızca kullanıcı ilgili özelliği açtığında izin ister. Konum, mikrofon, kişiler ve takip izni mevcut sürümde kullanılmaz.

## iOS Info.plist açıklamaları

```xml
<key>NSCameraUsageDescription</key>
<string>Cam veya pencere ölçüsü için destek fotoğrafı çekebilmeniz amacıyla kamera erişimi kullanılır.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Ölçü desteği için galerinizden seçtiğiniz fotoğrafı RGNFIX'e yükleyebilmeniz amacıyla fotoğraf erişimi kullanılır.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Sipariş veya ölçü çıktılarını cihazınıza kaydedebilmeniz amacıyla fotoğraf arşivine yazma erişimi kullanılır.</string>
```

Push Notifications yeteneği Apple Developer hesabı açıldıktan sonra Xcode Signing & Capabilities bölümünden eklenir. Kamera ve fotoğraf izinleri uygulama açılır açılmaz değil, Ölçü Fotoğrafı ekranındaki kullanıcı işlemiyle istenir.

## AndroidManifest.xml izinleri

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

Android'in güncel fotoğraf seçicisi kullanıldığında genel depolama izni istenmez. Eski Android sürümleri desteklenirken yalnızca gerçekten gerekirse sürüme bağlı medya okuma izni eklenir.

## Kullanılmayan izinler

Aşağıdaki izinler mevcut RGNFIX sürümüne eklenmemelidir:

- Hassas/arka plan konum
- Mikrofon
- Rehber/kişiler
- SMS ve arama kayıtları
- Tam dosya sistemi erişimi
- Reklam takip izni
- Bluetooth

## Bildirim kanalı

Android kanal kimliği: `rgnfix_orders`

Önerilen görünen ad: `Sipariş Güncellemeleri`

Önerilen açıklama: `Sipariş onayı, üretim, kargo ve teslimat bildirimleri.`
