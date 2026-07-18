import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, FileText, Headphones, ShieldCheck, Trash2 } from "lucide-react";

const UPDATED_AT = "18 Temmuz 2026";
const PHONE_DISPLAY = "+90 530 028 89 03";
const PHONE_LINK = "+905300288903";
const WHATSAPP_LINK = "https://wa.me/905300288903";

function LegalDocument({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container max-w-4xl py-10 sm:py-16">
      <div className="mb-8">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-serif font-bold sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{intro}</p>
        <p className="mt-3 text-xs text-muted-foreground">Son güncelleme: {UPDATED_AT}</p>
      </div>
      <Card className="border-border/60">
        <CardContent className="prose prose-slate max-w-none p-6 dark:prose-invert sm:p-9 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:font-semibold [&_li]:my-1 [&_p]:leading-7">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalDocument
      eyebrow="Yasal Bilgilendirme"
      title="Gizlilik Politikası"
      intro="Bu politika, RGNFIX web sitesi ve mobil uygulamasında kişisel verilerin hangi amaçlarla işlendiğini, nasıl korunduğunu ve kullanıcıların haklarını açıklar."
    >
      <h2>1. Veri sorumlusu ve iletişim</h2>
      <p>
        RGNFIX markası üzerinden hizmet sunan işletme, bu platformda işlenen kişisel veriler bakımından veri sorumlusu olarak hareket eder. Resmî ticari unvan ve kayıt bilgileri mağaza yayını öncesinde bu metne eklenecektir. Destek için <a href={`tel:${PHONE_LINK}`}>{PHONE_DISPLAY}</a> numarasından ulaşabilirsiniz.
      </p>

      <h2>2. Toplanan bilgiler</h2>
      <ul>
        <li>Ad soyad, e-posta, telefon, şehir ve teslimat adresi.</li>
        <li>Hesap ve oturum bilgileri; şifreler tek yönlü güvenli özet olarak saklanır.</li>
        <li>Sipariş, ölçü, ürün tercihi, montaj tipi ve müşteri notları.</li>
        <li>Cihaz, tarayıcı, hata kaydı, güvenlik ve kötüye kullanım önleme verileri.</li>
        <li>Kullanıcı izin verirse fotoğraf, kamera, bildirim belirteci ve paylaşım verileri.</li>
        <li>Yapay zekâ danışmanına yazılan mesajlar; bu özellik kullanıldığında yanıt üretmek amacıyla ilgili hizmet sağlayıcısına iletilebilir.</li>
      </ul>

      <h2>3. İşleme amaçları</h2>
      <ul>
        <li>Üyelik oluşturmak, oturum açmak ve hesabı korumak.</li>
        <li>Fiyat hesaplamak, özel ölçülü sipariş oluşturmak ve teslimat sürecini yürütmek.</li>
        <li>Sipariş durumunu göstermek ve bildirim göndermek.</li>
        <li>Ölçü, ürün, renk, montaj ve kullanım desteği sağlamak.</li>
        <li>Dolandırıcılık, yetkisiz erişim ve teknik hataları önlemek.</li>
        <li>Yasal yükümlülükleri yerine getirmek ve uyuşmazlıkları çözmek.</li>
      </ul>

      <h2>4. Paylaşım ve hizmet sağlayıcılar</h2>
      <p>
        Veriler; barındırma, veritabanı, e-posta, bildirim, hata izleme, kargo ve kullanıcı tarafından tercih edilen yapay zekâ hizmetlerinin sağlanması için gerekli olduğu ölçüde yetkili hizmet sağlayıcılarla paylaşılabilir. Kişisel veriler reklam amacıyla satılmaz.
      </p>

      <h2>5. Saklama süresi</h2>
      <p>
        Hesap bilgileri hesap açık olduğu sürece; sipariş ve işlem kayıtları ise hizmetin yürütülmesi, garanti, muhasebe ve ilgili mevzuat gereklilikleri için gerekli süre boyunca saklanır. Hesap silindiğinde aktif hizmet için gerekli olmayan profil ve ölçü verileri silinir; tamamlanmış sipariş kayıtları gerektiğinde kişisel bilgilerden arındırılarak tutulabilir.
      </p>

      <h2>6. Güvenlik</h2>
      <p>
        HTTPS, erişim kontrolü, şifre özetleme, oturum çerezleri, deneme sınırı ve sunucu tarafı yetki kontrolleri uygulanır. İnternet üzerinden hiçbir aktarım yöntemi mutlak güvenlik garantisi sağlamaz; güvenlik olayları değerlendirilerek gerekli önlemler alınır.
      </p>

      <h2>7. Kullanıcı hakları</h2>
      <p>
        Hesabınızdan verilerinizi indirebilir, profilinizi güncelleyebilir, şifrenizi değiştirebilir ve uygun koşullarda hesabınızı silebilirsiniz. Ayrıca verilerinize erişme, düzeltme, silme, işlemeyi sınırlandırma ve itiraz etme taleplerinizi destek kanallarından iletebilirsiniz.
      </p>

      <h2>8. Çocukların gizliliği</h2>
      <p>RGNFIX doğrudan çocuklara yönelik değildir. Bilerek 13 yaşın altındaki kişilerden hesap verisi toplanması amaçlanmaz.</p>

      <h2>9. Değişiklikler</h2>
      <p>Politika güncellendiğinde yeni tarih bu sayfada yayımlanır. Önemli değişiklikler uygulama içinde ayrıca duyurulabilir.</p>
    </LegalDocument>
  );
}

export function TermsOfUse() {
  return (
    <LegalDocument
      eyebrow="Yasal Bilgilendirme"
      title="Kullanım Koşulları"
      intro="RGNFIX hizmetlerini kullanarak aşağıdaki koşulları kabul etmiş olursunuz. Özel ölçülü ürünlerde verilen bilgilerin doğruluğu sipariş sonucunu doğrudan etkiler."
    >
      <h2>1. Hizmetin kapsamı</h2>
      <p>RGNFIX; ölçü rehberi, ürün karşılaştırma, fiyat hesaplama, sipariş, takip, montaj bilgileri ve destek araçları sunar. Bazı özellikler internet bağlantısı, üyelik veya üçüncü taraf hizmetleri gerektirir.</p>

      <h2>2. Hesap güvenliği</h2>
      <p>Kullanıcı doğru ve güncel bilgi vermek, şifresini gizli tutmak ve yetkisiz kullanımı bildirmekle sorumludur. Başkasına ait bilgilerle hesap oluşturulamaz.</p>

      <h2>3. Ölçü ve özel üretim</h2>
      <p>Ürünler kullanıcının verdiği ölçü ve tercihlere göre özel üretilebilir. Sipariş onayından önce ölçü, renk, adet, kasa ve montaj tipi kontrol edilmelidir. Uygulamadaki ölçü rehberi destek amaçlıdır; emin olunmayan durumlarda canlı destek alınmalıdır.</p>

      <h2>4. Fiyatlar ve sipariş</h2>
      <p>Gösterilen fiyatlar seçilen ürün, ölçü, adet, kasa ve teslimat koşullarına göre hesaplanır. Teknik hata veya açık fiyat hatası bulunması hâlinde kullanıcı bilgilendirilerek sipariş doğrulanır.</p>

      <h2>5. İptal</h2>
      <p>Uygun siparişler, oluşturulduktan sonraki 24 saat içinde müşteri hesabından iptal edilebilir. Üretime alınmış, teslim edilmiş veya özel koşulları oluşmuş siparişlerde yasal istisnalar ve ürünün niteliği uygulanabilir.</p>

      <h2>6. Yapay zekâ yanıtları</h2>
      <p>Yapay zekâ önerileri bilgilendirme amaçlıdır ve ölçü veya ürün siparişinin kullanıcı tarafından kontrol edilmesi gerekir. Sistem kesinlik garantisi vermez; nihai sipariş bilgileri sipariş özetinde gösterilir.</p>

      <h2>7. Yasak kullanım</h2>
      <ul>
        <li>Sisteme zarar verme, yetkisiz erişim veya otomatik kötüye kullanım.</li>
        <li>Yanıltıcı kimlik veya teslimat bilgisi kullanma.</li>
        <li>İçerik, marka veya yazılımı izinsiz kopyalama ve ticari olarak yeniden dağıtma.</li>
      </ul>

      <h2>8. Hizmet değişiklikleri</h2>
      <p>Güvenlik, bakım, mevzuat veya ürün geliştirme nedeniyle özellikler güncellenebilir. Siparişe ilişkin kazanılmış haklar ve yürürlükteki tüketici mevzuatı saklıdır.</p>

      <h2>9. İletişim</h2>
      <p>Sorularınız için <a href={`tel:${PHONE_LINK}`}>{PHONE_DISPLAY}</a> numarasından destek alabilirsiniz.</p>
    </LegalDocument>
  );
}

export function KvkkNotice() {
  return (
    <LegalDocument
      eyebrow="KVKK"
      title="Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni"
      intro="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında RGNFIX hizmetlerinde gerçekleştirilen veri işleme faaliyetleri hakkında bilgilendirme metnidir."
    >
      <h2>Veri kategorileri</h2>
      <p>Kimlik, iletişim, müşteri işlem, sipariş, teslimat, ölçü, işlem güvenliği, talep/şikâyet ve kullanıcı tarafından isteğe bağlı iletilen görsel veriler işlenebilir.</p>

      <h2>Hukuki sebepler ve amaçlar</h2>
      <p>Veriler; sözleşmenin kurulması ve ifası, hukuki yükümlülüklerin yerine getirilmesi, hakkın tesisi/kullanılması/korunması, meşru menfaat ve gerekli durumlarda açık rıza hukuki sebeplerine dayanılarak işlenir.</p>

      <h2>Aktarım</h2>
      <p>Veriler, hizmetin yürütülmesi için gerekli ölçüde barındırma ve bilişim sağlayıcıları, kargo/teslimat hizmetleri, yetkili kamu kurumları ve kullanıcının tercih ettiği özelliklere bağlı teknoloji sağlayıcılarıyla paylaşılabilir. Yurt dışı aktarım gereken hâllerde yürürlükteki mevzuata uygun güvence mekanizmaları uygulanır.</p>

      <h2>Toplama yöntemi</h2>
      <p>Bilgiler web sitesi, mobil uygulama, formlar, çerez/oturum kayıtları, destek görüşmeleri ve sipariş işlemleri üzerinden elektronik veya sözlü yöntemlerle toplanabilir.</p>

      <h2>KVKK kapsamındaki haklar</h2>
      <p>Kanunun 11. maddesi kapsamında verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, amacına uygun kullanılıp kullanılmadığını öğrenme, aktarılan kişileri bilme, düzeltme, silme/yok etme, yapılan işlemlerin aktarım yapılan kişilere bildirilmesini isteme, otomatik analiz sonucuna itiraz ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>

      <h2>Başvuru</h2>
      <p>Kimliğinizi doğrulayacak bilgiler ve talebinizle birlikte destek kanalından başvuru yapabilirsiniz. Resmî işletme unvanı, açık adres ve e-posta bilgisi mağaza yayını öncesinde bu bölüme eklenecektir.</p>
    </LegalDocument>
  );
}

export function SupportPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Headphones className="h-8 w-8 text-primary" /></div>
        <h1 className="mt-5 text-3xl font-serif font-bold">Destek Merkezi</h1>
        <p className="mt-3 text-muted-foreground">Hesap, ölçü, sipariş, montaj ve teslimat konularında destek alın.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="p-6"><h2 className="font-semibold">Telefon</h2><p className="mt-2 text-sm text-muted-foreground">Çalışma saatleri içinde doğrudan ulaşın.</p><a className="mt-5 inline-flex font-semibold text-primary" href={`tel:${PHONE_LINK}`}>{PHONE_DISPLAY}</a></CardContent></Card>
        <Card><CardContent className="p-6"><h2 className="font-semibold">WhatsApp</h2><p className="mt-2 text-sm text-muted-foreground">Ölçü fotoğrafı ve sipariş numaranızı güvenli biçimde iletin.</p><a className="mt-5 inline-flex items-center gap-1 font-semibold text-primary" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">WhatsApp’ta Aç <ExternalLink className="h-4 w-4" /></a></CardContent></Card>
      </div>
      <Card className="mt-5"><CardContent className="p-6"><h2 className="font-semibold">Hızlı bağlantılar</h2><div className="mt-4 flex flex-wrap gap-3"><Link href="/gizlilik-politikasi"><Button variant="outline"><ShieldCheck className="mr-2 h-4 w-4" />Gizlilik</Button></Link><Link href="/kullanim-kosullari"><Button variant="outline"><FileText className="mr-2 h-4 w-4" />Koşullar</Button></Link><Link href="/hesap-silme"><Button variant="outline"><Trash2 className="mr-2 h-4 w-4" />Hesap Silme</Button></Link></div></CardContent></Card>
    </div>
  );
}

export function DeleteAccountPage() {
  return (
    <div className="container max-w-2xl py-10 sm:py-16">
      <Card className="border-destructive/25">
        <CardContent className="p-6 sm:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10"><Trash2 className="h-7 w-7 text-destructive" /></div>
          <h1 className="mt-5 text-3xl font-serif font-bold">RGNFIX Hesabını Silme</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">Hesabınızı web sitesi veya mobil uygulama üzerinden silebilirsiniz. Güvenlik için giriş yaptıktan sonra mevcut şifrenizi doğrulamanız gerekir.</p>
          <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-6">
            <li>Hesabınıza giriş yapın.</li>
            <li><strong>Hesap Ayarları</strong> sayfasını açın.</li>
            <li><strong>Hesabımı Sil</strong> bölümünde şifrenizi girip işlemi onaylayın.</li>
          </ol>
          <div className="mt-7 rounded-xl bg-muted p-4 text-sm text-muted-foreground">Devam eden sipariş varsa hesap, sipariş tamamlanana veya iptal edilene kadar silinemez. Silme tamamlandığında profil ve ölçü kayıtları kaldırılır; tamamlanmış sipariş kayıtları gerekli yasal/operasyonel süre boyunca kişisel bilgilerden arındırılarak saklanabilir.</div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/giris"><Button className="w-full sm:w-auto">Giriş Yap</Button></Link><Link href="/hesap-ayarlari"><Button variant="outline" className="w-full sm:w-auto">Hesap Ayarlarına Git</Button></Link></div>
          <p className="mt-6 text-xs text-muted-foreground">Giriş yapamıyorsanız <a className="font-medium text-primary" href={WHATSAPP_LINK} target="_blank" rel="noreferrer">destek ekibine</a> ulaşın.</p>
        </CardContent>
      </Card>
    </div>
  );
}
