import { DoorOpen, Grid2X2, PackageCheck, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const products = [
  {
    title: "Pencere Akordiyon Sineklik",
    price: "1.500 TL",
    description: "Pencerenize özel ölçüyle hazırlanan, yana toplanan akordiyon sineklik.",
    icon: Grid2X2,
  },
  {
    title: "Kapı Akordiyon Sineklik",
    price: "1.800 TL",
    description: "Balkon ve geçiş kapılarına uygun, kolay açılıp kapanan akordiyon sistem.",
    icon: DoorOpen,
  },
];

export default function InsectScreen() {
  return (
    <div className="container max-w-5xl py-10 sm:py-14">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-7 sm:p-12">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium text-primary shadow-sm">
            <Sparkles className="h-4 w-4" /> Ölçüye özel üretim
          </div>
          <h1 className="text-3xl font-bold sm:text-5xl">Akordiyon Sineklik</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Pencere ve kapılar için ölçüye özel, sağlam ve kullanışlı demonte sineklik çözümleri.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2"><Ruler className="h-4 w-4 text-primary" /> Özel ölçü</span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2"><PackageCheck className="h-4 w-4 text-primary" /> Demonte gönderim</span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2"><ShieldCheck className="h-4 w-4 text-primary" /> Fiber tül</span>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {products.map(product => {
          const Icon = product.icon;
          return (
            <Card key={product.title} className="overflow-hidden border-border/60">
              <div className="flex h-56 items-center justify-center bg-gradient-to-br from-muted to-primary/10">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl border bg-background/90 shadow-lg">
                  <Icon className="h-14 w-14 text-primary" />
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-primary">Demonte fiyat</p>
                <h2 className="mt-1 text-xl font-bold">{product.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{product.description}</p>
                <p className="mt-5 text-3xl font-bold">{product.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">Ölçü ve uygulama uygunluğu kontrol edilerek sipariş oluşturulur.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold">Sineklik ölçüsü için destek alın</h3>
            <p className="mt-1 text-sm text-muted-foreground">Uygulama alanınızın görselini ve yaklaşık ölçüsünü WhatsApp üzerinden iletin.</p>
          </div>
          <Button asChild className="shrink-0">
            <a href="https://wa.me/905300288903?text=Merhaba%2C%20sineklik%20i%C3%A7in%20%C3%B6l%C3%A7%C3%BC%20ve%20fiyat%20deste%C4%9Fi%20almak%20istiyorum." target="_blank" rel="noreferrer">WhatsApp’tan Sor</a>
          </Button>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Ürün görsel referansları Plise Perde Gaziantep sineklik sayfasındaki ürünlerden alınarak geliştirilecektir.
      </p>
    </div>
  );
}
