import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layers, Check, ArrowRight, Sparkles, Maximize2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FABRIC_SERIES } from "@shared/types";
import { Link } from "wouter";

const fabricCatalog = [
  { series: "nova", name: "Beyaz", code: "VR 01", image: "/fabrics/catalog/nova-beyaz.png" },
  { series: "nova", name: "Krem", code: "VR 02", image: "/fabrics/catalog/nova-krem.png" },
  { series: "nova", name: "Bej", code: "VR 03", image: "/fabrics/catalog/nova-bej.png" },
  { series: "nova", name: "Açık Gri", code: "VR 04", image: "/fabrics/catalog/nova-acik-gri.png" },
  { series: "nova", name: "Gümüş Gri", code: "VR 05", image: "/fabrics/catalog/nova-gri.png" },
  { series: "nova", name: "Gri", code: "VR 06", image: "/fabrics/catalog/nova-antrasit.png" },
  { series: "nova", name: "Antrasit", code: "VR 07", image: "/fabrics/catalog/nova-koyu-antrasit.png" },
  { series: "nova", name: "Kahve", code: "VR 08", image: "/fabrics/catalog/nova-kahve.png" },
  { series: "nova", name: "Lacivert", code: "VR 09", image: "/fabrics/catalog/nova-koyu-kahve.png" },
  { series: "nova", name: "Siyah", code: "VR 10", image: "/fabrics/catalog/nova-siyah.png" },
  { series: "neo-fashion", name: "Beyaz", code: "VR 01", image: "/fabrics/catalog/neo-desen-1.jpg" },
  { series: "neo-fashion", name: "Krem", code: "VR 02", image: "/fabrics/catalog/neo-krem-desen.png" },
  { series: "neo-fashion", name: "Gri", code: "VR 03", image: "/fabrics/catalog/neo-desen-5.png" },
  { series: "neo-fashion", name: "Antrasit", code: "VR 04", image: "/fabrics/catalog/neo-desen-6.png" },
  { series: "neo-fashion", name: "Beyaz Desenli", code: "VR 05", image: "/fabrics/catalog/neo-beyaz-desen.png" },
  { series: "neo-fashion", name: "Ekru", code: "VR 06", image: "/fabrics/catalog/neo-desen-7.png" },
  { series: "neo-fashion", name: "Açık Gri", code: "VR 07", image: "/fabrics/catalog/neo-gri-desen.png" },
  { series: "neo-fashion", name: "Koyu Gri", code: "VR 08", image: "/fabrics/catalog/neo-siyah-desen.png" },
  { series: "nano-clean", name: "Beyaz", code: "VR 01", image: "/fabrics/catalog/clean-1.png" },
  { series: "nano-clean", name: "Krem", code: "VR 02", image: "/fabrics/catalog/clean-2.png" },
  { series: "nano-clean", name: "Gri", code: "VR 03", image: "/fabrics/catalog/clean-3.png" },
  { series: "nano-clean", name: "Antrasit", code: "VR 04", image: "/fabrics/catalog/clean-4.png" },
  { series: "nano-insulation", name: "Krem", code: "VR 01", image: "/fabrics/catalog/insulation-1.png" },
  { series: "nano-insulation", name: "Açık Gri", code: "VR 02", image: "/fabrics/catalog/insulation-2.png" },
  { series: "nano-insulation", name: "Antrasit", code: "VR 03", image: "/fabrics/catalog/insulation-3.png" },
  { series: "nano-pro", name: "Beyaz", code: "VR 01", image: "/fabrics/catalog/pro-1.png" },
  { series: "nano-pro", name: "Krem", code: "VR 02", image: "/fabrics/catalog/pro-2.png" },
  { series: "nano-pro", name: "Gri", code: "VR 03", image: "/fabrics/catalog/pro-3.png" },
  { series: "nano-pro", name: "Antrasit", code: "VR 04", image: "/fabrics/catalog/pro-4.png" },
] as const;

type FabricCatalogItem = (typeof fabricCatalog)[number];

export default function FabricComparison() {
  const [selected, setSelected] = useState<string[]>([]);
  const [activeSeries, setActiveSeries] = useState<string>("nova");
  const [selectedFabric, setSelectedFabric] = useState<FabricCatalogItem | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const selectedSeries = FABRIC_SERIES.filter((s) => selected.includes(s.id));
  const activeSeriesName = FABRIC_SERIES.find((series) => series.id === activeSeries)?.name ?? "Kumaş";
  const visibleFabrics = fabricCatalog
    .filter((item) => item.series === activeSeries)
    .sort((a, b) => a.code.localeCompare(b.code, "tr"));

  return (
    <div className="container py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Layers className="h-3.5 w-3.5" />
          Detaylı Karşılaştırma
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
          Kumaş Karşılaştırma
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          RGNFIX koleksiyonundaki kumaşları, renkleri ve teknik özellikleri birlikte inceleyin
          <span className="block text-xs mt-1">(En fazla 3 seri seçebilirsiniz)</span>
        </p>
      </div>

      {/* Fabric Series Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {FABRIC_SERIES.map((series) => (
          <Card
            key={series.id}
            className={`cursor-pointer transition-all duration-200 ${
              selected.includes(series.id)
                ? "border-primary ring-2 ring-primary/20"
                : "border-border/50 hover:border-primary/30"
            }`}
            onClick={() => toggleSelect(series.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{series.name}</h3>
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {series.pricePerSqm} ₺/m²
                  </p>
                </div>
                {selected.includes(series.id) && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              {series.imageUrl && (
                <div className="w-full h-36 rounded-xl overflow-hidden mb-3 bg-muted">
                  <img src={series.imageUrl} alt={series.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Opaklık</span>
                    <span className="font-medium">%{series.opacity}</span>
                  </div>
                  <Progress value={series.opacity} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Kalite</span>
                    <span className="font-medium">{series.weight} gr/m²</span>
                  </div>
                  <Progress value={Math.min((series.weight / 300) * 100, 100)} className="h-1.5" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {series.features.slice(0, 2).map((f, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {f}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fabric color and texture catalog */}
      <section className="mb-12 rounded-3xl border border-border/60 bg-card p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-secondary mb-2">
              <Sparkles className="h-4 w-4" /> RENK VE DOKU KATALOĞU
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Kumaşınızı yakından seçin</h2>
            <p className="text-sm text-muted-foreground mt-2">Seriye göre filtreleyin; kumaşa tıklayarak büyük görseli ve tam adını açın.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FABRIC_SERIES.map((series) => (
              <Button
                key={series.id}
                type="button"
                size="sm"
                variant={activeSeries === series.id ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setActiveSeries(series.id)}
              >
                {series.name}
                <span className="ml-1 text-[10px] opacity-70">{fabricCatalog.filter((item) => item.series === series.id).length}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {visibleFabrics.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setSelectedFabric(item)}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-background text-left transition-all duration-200 hover:-translate-y-1 hover:border-secondary/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              aria-label={`${activeSeriesName} ${item.name} kumaşını aç`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                <img src={item.image} alt={`${item.name} plise perde kumaşı`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex items-start justify-between gap-2 p-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-secondary">{item.code}</p>
                  <h3 className="mt-1 text-sm font-semibold">{activeSeriesName} {item.name}</h3>
                </div>
                <Maximize2 className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-secondary" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={selectedFabric !== null} onOpenChange={(open) => !open && setSelectedFabric(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-4xl">
          {selectedFabric && (
            <div className="grid md:grid-cols-[1.05fr_.95fr]">
              <div className="min-h-80 bg-muted">
                <img
                  src={selectedFabric.image}
                  alt={`${FABRIC_SERIES.find((series) => series.id === selectedFabric.series)?.name} ${selectedFabric.name}`}
                  className="h-full max-h-[78vh] w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-9">
                <DialogHeader>
                  <div className="mb-2 text-xs font-semibold tracking-[0.18em] text-secondary">{selectedFabric.code}</div>
                  <DialogTitle className="pr-8 text-2xl sm:text-3xl">
                    {FABRIC_SERIES.find((series) => series.id === selectedFabric.series)?.name} {selectedFabric.name}
                  </DialogTitle>
                  <DialogDescription className="pt-2 leading-relaxed">
                    Yüksek çözünürlüklü kumaş görünümü. Renk tonu ekran ve ortam ışığına göre küçük farklılıklar gösterebilir.
                  </DialogDescription>
                </DialogHeader>

                <div className="my-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted p-3">
                    <span className="block text-[10px] text-muted-foreground">SERİ</span>
                    <strong className="mt-1 block text-sm">{FABRIC_SERIES.find((series) => series.id === selectedFabric.series)?.name}</strong>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <span className="block text-[10px] text-muted-foreground">KUMAŞ KODU</span>
                    <strong className="mt-1 block text-sm">{selectedFabric.code}</strong>
                  </div>
                </div>

                <Link href={`/siparis?series=${selectedFabric.series}&fabricColor=${encodeURIComponent(`${selectedFabric.code} ${selectedFabric.name}`)}`} onClick={() => setSelectedFabric(null)}>
                  <Button className="w-full gap-2 rounded-xl">
                    <ShoppingCart className="h-4 w-4" /> Bu Kumaşla Sipariş Oluştur
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comparison Table */}
      {selectedSeries.length >= 2 && (
        <Card className="border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-serif">Karşılaştırma Tablosu</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Özellik</th>
                  {selectedSeries.map((s) => (
                    <th key={s.id} className="text-center py-3 px-4 font-semibold">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Fiyat (m²)</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4 font-semibold text-primary">
                      {s.pricePerSqm} ₺
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Opaklık</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4 font-medium">
                      %{s.opacity}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Kumaş Kalitesi</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4 font-medium">
                      {s.weight} gr/m²
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Pile Sıklığı</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4">
                      {s.pileFold} mm
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Malzeme</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4">
                      {s.material}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Garanti</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4">
                      {s.warranty}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4 text-muted-foreground">Kullanım Ömrü</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4">
                      {s.lifespan}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">Özellikler</td>
                  {selectedSeries.map((s) => (
                    <td key={s.id} className="text-center py-3 px-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {s.features.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {selected.length < 2 && selected.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Karşılaştırma için en az 2 seri seçin
        </p>
      )}

      {selectedSeries.length >= 1 && (
        <div className="text-center mt-6">
          <Link href={`/fiyat-hesapla?series=${selectedSeries[0]?.id}`}>
            <Button className="btn-premium gap-2">
              Fiyat Hesapla
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
