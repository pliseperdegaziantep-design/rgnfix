import { useEffect } from "react";
import { DoorOpen, Grid2X2, PackageCheck, Ruler, ShieldCheck, Sparkles, CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const products = [
  {
    title: "Pencere Plise Sineklik - Antrasit",
    shortTitle: "Antrasit Pencere Plise Sineklik",
    image: "/sineklik/pencere-antrasit.svg",
    description: "Antrasit PVC ve alüminyum pencereler için ölçüye özel üretilen, yana toplanan plise sineklik. İnce fiber tülü havalandırmayı korurken sinek ve böceklerin içeri girmesini engeller.",
    keywords: "antrasit pencere plise sineklik, plise sineklik, ölçüye özel sineklik",
    icon: Grid2X2,
  },
  {
    title: "Pencere Plise Sineklik - Beyaz",
    shortTitle: "Beyaz Pencere Plise Sineklik",
    image: "/sineklik/pencere-beyaz.svg",
    description: "Beyaz PVC pencerelerle uyumlu, şık ve kullanışlı pencere plise sineklik modeli. Özel ölçü üretim, kolay kullanım ve temiz görünüm sunar.",
    keywords: "beyaz pencere plise sineklik, ölçüye özel sineklik, fiber tül sineklik",
    icon: Grid2X2,
  },
  {
    title: "Kapı Plise Sineklik - Antrasit",
    shortTitle: "Antrasit Kapı Plise Sineklik",
    image: "/sineklik/kapi-antrasit.svg",
    description: "Balkon kapısı, teras kapısı ve sürgülü geçişler için sağlam antrasit kapı plise sinekliği. Geniş açıklıklarda rahat geçiş sağlar ve kullanılmadığında yana toplanır.",
    keywords: "kapı plise sineklik, balkon kapısı plise sineklik, antrasit plise sineklik",
    icon: DoorOpen,
  },
  {
    title: "Kapı Plise Sineklik - Beyaz",
    shortTitle: "Beyaz Kapı Plise Sineklik",
    image: "/sineklik/kapi-beyaz.svg",
    description: "Beyaz balkon ve teras kapıları için ölçüye özel plise sineklik. Dayanıklı ray sistemi, fiber tül ve kolay açılıp kapanan yapısıyla günlük kullanım için idealdir.",
    keywords: "beyaz kapı plise sineklik, teras kapısı plise sineklik, demonte sineklik",
    icon: DoorOpen,
  },
];

const benefits = [
  "Pencere ve kapıya özel ölçü üretim",
  "Dayanıklı siyah fiber tül",
  "Yana toplanan pileli akordiyon sistem",
  "Beyaz ve antrasit profil seçenekleri",
  "Türkiye geneli güvenli demonte gönderim",
  "Ölçü ve montaj için WhatsApp desteği",
];

export default function InsectScreen() {
  useEffect(() => {
    document.title = "Plise Sineklik Fiyatları | Pencere ve Kapı Plise Sineklik - RGNFIX";
    const description = "Pencere ve kapılar için ölçüye özel plise sineklik. Beyaz ve antrasit profil, fiber tül, demonte gönderim ve Türkiye geneli ölçü desteği.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    return () => { document.title = "RGNFIX"; };
  }, []);

  return (
    <div className="container max-w-6xl py-10 sm:py-14">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-7 sm:p-12">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="h-4 w-4" /> Ölçüye özel pencere ve kapı plise sineklik
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">Plise Sineklik Modelleri ve Fiyat Desteği</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Evinizi havalandırırken sinek, sivrisinek ve böceklerden korunmak için pencere ve kapınıza özel üretilen plise sineklik çözümlerini inceleyin. Fiber tüllü plise sineklikler, kullanılmadığında yana toplanır ve doğramanızla uyumlu temiz bir görünüm sağlar.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2"><Ruler className="h-4 w-4 text-primary" /> Özel ölçü</span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2"><PackageCheck className="h-4 w-4 text-primary" /> Türkiye geneli gönderim</span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2"><ShieldCheck className="h-4 w-4 text-primary" /> Kaliteli fiber tül</span>
          </div>
          <Button asChild className="mt-7 h-12 gap-2 px-6">
            <a href="https://wa.me/905300288903?text=Merhaba%2C%20pencere%20veya%20kap%C4%B1%20plise%20sineklik%20i%C3%A7in%20%C3%B6l%C3%A7%C3%BC%20ve%20fiyat%20deste%C4%9Fi%20almak%20istiyorum." target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Anlık Fiyat Al</a>
          </Button>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="pencere-sineklik-baslik">
        <div className="mb-5">
          <p className="text-sm font-semibold text-primary">PENCERE MODELLERİ</p>
          <h2 id="pencere-sineklik-baslik" className="mt-1 text-2xl font-bold sm:text-3xl">Pencere Plise Sineklik Örnekleri</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">PVC, alüminyum ve standart pencere doğramaları için beyaz veya antrasit profilli pencere plise sineklik seçenekleri.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {products.slice(0, 2).map(product => <ProductCard key={product.title} product={product} />)}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="kapi-sineklik-baslik">
        <div className="mb-5">
          <p className="text-sm font-semibold text-primary">KAPI MODELLERİ</p>
          <h2 id="kapi-sineklik-baslik" className="mt-1 text-2xl font-bold sm:text-3xl">Kapı Plise Sineklik Örnekleri</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Balkon, teras ve sürgülü kapılara uygun, rahat geçiş sağlayan ölçüye özel kapı plise sineklik sistemleri.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {products.slice(2).map(product => <ProductCard key={product.title} product={product} />)}
        </div>
      </section>

      <Card className="mt-12 border-primary/20 bg-primary/5">
        <CardContent className="grid gap-7 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">NEDEN PLİSE SİNEKLİK?</p>
            <h2 className="mt-2 text-2xl font-bold">Şık görünüm, kolay kullanım, etkili koruma</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Plise sineklik, klasik sabit sinekliklere göre daha az yer kaplar. Tül yana toplandığı için pencere veya kapı açıklığını ihtiyaç halinde tamamen kullanabilirsiniz.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map(item => <div key={item} className="flex items-start gap-2 rounded-xl border bg-background p-3 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{item}</span></div>)}
          </div>
        </CardContent>
      </Card>

      <section className="mt-12 rounded-3xl border p-6 sm:p-9">
        <h2 className="text-2xl font-bold">Plise sineklik ölçüsü nasıl alınır?</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">Doğru fiyat ve üretim için uygulama yapılacak pencere veya kapının net en ve boy ölçüsü gerekir. Ölçüyü çelik metreyle santimetre olarak alın. Ondalıklı bir değer çıkarsa yuvarlamadan, örneğin 56,4 cm şeklinde yazın. Görselinizi ve ölçünüzü WhatsApp üzerinden gönderdiğinizde uygun model ve profil seçimi kontrol edilir.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2"><a href="https://wa.me/905300288903?text=Merhaba%2C%20plise%20sineklik%20%C3%B6l%C3%A7%C3%BCs%C3%BC%20ve%20fiyat%C4%B1%20i%C3%A7in%20destek%20istiyorum." target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Ölçü ve Fiyat Desteği</a></Button>
          <Button asChild variant="outline"><a href="tel:+905300288903">0530 028 89 03</a></Button>
        </div>
      </section>

      <div className="mt-10 text-sm leading-7 text-muted-foreground">
        <h2 className="text-xl font-bold text-foreground">Gaziantep ve Türkiye Geneli Plise Sineklik Çözümleri</h2>
        <p className="mt-2">RGNFIX; Gaziantep plise sineklik, pencere plise sineklik, kapı plise sineklik ve demonte sineklik aramalarında ihtiyaca uygun ürün seçimini kolaylaştırır. Gaziantep içi uygulama uygunluğuna göre montaj desteği, şehir dışına ise ölçüye özel hazırlanmış ürünlerin güvenli gönderimi sağlanır.</p>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: (typeof products)[number] }) {
  const Icon = product.icon;
  return (
    <Card className="group overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img src={product.image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow"><Icon className="h-4 w-4 text-primary" /> {product.shortTitle}</div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold">{product.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{product.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">Arama konuları: {product.keywords}</p>
        <Button asChild variant="outline" className="mt-5 w-full gap-2"><a href={`https://wa.me/905300288903?text=${encodeURIComponent(`Merhaba, ${product.title} için ölçü ve fiyat almak istiyorum.`)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Bu Model İçin Fiyat Al</a></Button>
      </CardContent>
    </Card>
  );
}
