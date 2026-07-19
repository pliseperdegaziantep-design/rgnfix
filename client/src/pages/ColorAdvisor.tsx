import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sparkles, ArrowRight, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { FABRIC_SERIES } from "@shared/types";

// 30+ temel ev rengi (mor, pembe, turuncu hariç)
const ROOM_COLORS = [
  { id: "beyaz", name: "Beyaz", hex: "#FFFFFF" },
  { id: "kirli-beyaz", name: "Kirli Beyaz", hex: "#FAF9F6" },
  { id: "krem", name: "Krem", hex: "#FFFDD0" },
  { id: "fildisi", name: "Fildişi", hex: "#FFFFF0" },
  { id: "vanilya", name: "Vanilya", hex: "#F3E5AB" },
  { id: "sampanya", name: "Şampanya", hex: "#F7E7CE" },
  { id: "bej", name: "Bej", hex: "#D4C5A9" },
  { id: "kum", name: "Kum Rengi", hex: "#C2B280" },
  { id: "deve-tuyu", name: "Deve Tüyü", hex: "#C19A6B" },
  { id: "cappuccino", name: "Cappuccino", hex: "#A67B5B" },
  { id: "acik-kahve", name: "Açık Kahve", hex: "#A0785A" },
  { id: "kahverengi", name: "Kahverengi", hex: "#6B4226" },
  { id: "koyu-kahve", name: "Koyu Kahve", hex: "#3B2212" },
  { id: "ceviz", name: "Ceviz", hex: "#5C3317" },
  { id: "acik-gri", name: "Açık Gri", hex: "#D3D3D3" },
  { id: "gri", name: "Gri", hex: "#9CA3AF" },
  { id: "antrasit", name: "Antrasit", hex: "#383838" },
  { id: "koyu-gri", name: "Koyu Gri", hex: "#4A4A4A" },
  { id: "siyah", name: "Siyah", hex: "#1A1A1A" },
  { id: "acik-mavi", name: "Açık Mavi", hex: "#ADD8E6" },
  { id: "buz-mavisi", name: "Buz Mavisi", hex: "#BFEFFF" },
  { id: "gok-mavisi", name: "Gök Mavisi", hex: "#87CEEB" },
  { id: "lacivert", name: "Lacivert", hex: "#191970" },
  { id: "petrol-mavisi", name: "Petrol Mavisi", hex: "#006D6F" },
  { id: "acik-yesil", name: "Açık Yeşil", hex: "#90EE90" },
  { id: "cagla-yesili", name: "Çağla Yeşili", hex: "#ACE1AF" },
  { id: "zeytin-yesili", name: "Zeytin Yeşili", hex: "#808000" },
  { id: "koyu-yesil", name: "Koyu Yeşil", hex: "#006400" },
  { id: "sari", name: "Sarı", hex: "#FFD700" },
  { id: "hardal", name: "Hardal", hex: "#FFDB58" },
  { id: "altin", name: "Altın", hex: "#CFB53B" },
  { id: "terrakota", name: "Terrakota", hex: "#CC4E3A" },
  { id: "bordo", name: "Bordo", hex: "#800020" },
];

// 15 dekorasyon stili
const DECOR_STYLES = [
  { id: "modern", name: "Modern / Minimalist" },
  { id: "klasik", name: "Klasik / Geleneksel" },
  { id: "skandinav", name: "İskandinav" },
  { id: "rustik", name: "Rustik / Doğal" },
  { id: "endustriyel", name: "Endüstriyel / Loft" },
  { id: "bohem", name: "Bohem" },
  { id: "art-deco", name: "Art Deco" },
  { id: "country", name: "Country / Kır Evi" },
  { id: "akdeniz", name: "Akdeniz" },
  { id: "japon", name: "Japon / Zen" },
  { id: "retro", name: "Retro / Vintage" },
  { id: "luks", name: "Lüks / Glam" },
  { id: "cagdas", name: "Çağdaş" },
  { id: "eklektik", name: "Eklektik" },
  { id: "tropikal", name: "Tropikal" },
];

// Kumaş renk önerileri (gerçek mevcut renkler)
const FABRIC_COLOR_OPTIONS = [
  { name: "Beyaz", hex: "#FFFFFF", series: ["nova", "neo-fashion", "nano-clean", "nano-insulation", "nano-pro"] },
  { name: "Krem", hex: "#F5F0E0", series: ["nova", "neo-fashion", "nano-clean", "nano-insulation", "nano-pro"] },
  { name: "Ekru", hex: "#F0EAD6", series: ["nova", "neo-fashion", "nano-clean", "nano-insulation"] },
  { name: "Bej", hex: "#D4C5A9", series: ["nova", "neo-fashion", "nano-clean", "nano-insulation", "nano-pro"] },
  { name: "Açık Gri", hex: "#D3D3D3", series: ["nova", "neo-fashion", "nano-clean", "nano-insulation", "nano-pro"] },
  { name: "Gri", hex: "#9CA3AF", series: ["neo-fashion", "nano-clean", "nano-insulation", "nano-pro"] },
  { name: "Antrasit", hex: "#383838", series: ["neo-fashion", "nano-insulation", "nano-pro"] },
  { name: "Cappuccino", hex: "#A67B5B", series: ["nova", "neo-fashion", "nano-insulation"] },
  { name: "Kahve", hex: "#6B4226", series: ["neo-fashion", "nano-insulation", "nano-pro"] },
  { name: "Siyah", hex: "#1A1A1A", series: ["nano-pro"] },
];

interface ColorRecommendation {
  fabricColors: string[];
  profileColor: string;
  reasoning: string;
  suggestedSeries: string[];
}

export default function ColorAdvisor() {
  const [wallColor, setWallColor] = useState("");
  const [floorColor, setFloorColor] = useState("");
  const [furnitureColor, setFurnitureColor] = useState("");
  const [decorStyle, setDecorStyle] = useState("");
  const [recommendation, setRecommendation] = useState<ColorRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const colorMutation = trpc.ai.colorAdvice.useMutation();

  const getRecommendation = async () => {
    if (!wallColor || !decorStyle) return;
    setIsLoading(true);
    try {
      const result = await colorMutation.mutateAsync({
        wallColor,
        floorColor,
        furnitureColor,
        decorStyle,
      });
      setRecommendation(result as ColorRecommendation);
    } catch {
      // Fallback: basit renk eşleştirme mantığı
      const wallInfo = ROOM_COLORS.find(c => c.id === wallColor);
      let colors: string[] = [];
      let profile = "Beyaz";
      let series: string[] = ["nova", "neo-fashion"];

      if (wallInfo) {
        const lightWalls = ["beyaz", "kirli-beyaz", "krem", "fildisi", "vanilya", "sampanya"];
        const warmWalls = ["bej", "kum", "deve-tuyu", "cappuccino", "acik-kahve", "kahverengi", "koyu-kahve", "ceviz"];
        const coolWalls = ["acik-gri", "gri", "antrasit", "koyu-gri", "siyah"];

        if (lightWalls.includes(wallColor)) {
          colors = ["Krem", "Bej", "Açık Gri", "Ekru"];
          profile = "Beyaz";
        } else if (warmWalls.includes(wallColor)) {
          colors = ["Krem", "Cappuccino", "Bej", "Ekru"];
          profile = "Krem";
          series = ["neo-fashion", "nano-insulation"];
        } else if (coolWalls.includes(wallColor)) {
          colors = ["Açık Gri", "Beyaz", "Gri", "Antrasit"];
          profile = "Gümüş Gri";
          series = ["nano-clean", "nano-pro"];
        } else {
          colors = ["Krem", "Beyaz", "Bej"];
          profile = "Beyaz";
        }
      }

      setRecommendation({
        fabricColors: colors,
        profileColor: profile,
        reasoning: `${wallInfo?.name || ""} duvar renginiz ve ${DECOR_STYLES.find(s => s.id === decorStyle)?.name || ""} stilinize göre, uyumlu ve şık bir görünüm için bu renk kombinasyonları önerilmektedir. Nötr ve doğal tonlar her mekan ile uyum sağlar.`,
        suggestedSeries: series,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Palette className="h-3.5 w-3.5" />
          AI Destekli Renk Danışmanı
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Renk Danışmanı</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Odanızın renklerine ve dekorasyon stilinize göre en uyumlu perde rengini önerelim
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Oda Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Duvar Rengi *</Label>
              <Select value={wallColor} onValueChange={setWallColor}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Duvar renginizi seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ROOM_COLORS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Zemin Rengi</Label>
              <Select value={floorColor} onValueChange={setFloorColor}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Zemin renginizi seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ROOM_COLORS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mobilya Rengi</Label>
              <Select value={furnitureColor} onValueChange={setFurnitureColor}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Mobilya renginizi seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ROOM_COLORS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dekorasyon Stili *</Label>
              <Select value={decorStyle} onValueChange={setDecorStyle}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Dekorasyon stilinizi seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {DECOR_STYLES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={getRecommendation} disabled={!wallColor || !decorStyle || isLoading} className="w-full btn-premium gap-2">
              {isLoading ? "Analiz ediliyor..." : <><Sparkles className="h-4 w-4" /> Renk Önerisi Al</>}
            </Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Öneriler mevcut kumaş renk seçeneklerimiz arasından yapılmaktadır. Nötr ve doğal tonlar her mekan ile uyum sağlar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Öneri</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendation ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Önerilen Kumaş Renkleri</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.fabricColors.map((color, i) => {
                      const colorInfo = FABRIC_COLOR_OPTIONS.find(c => c.name === color);
                      return (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
                          {colorInfo && <div className="w-5 h-5 rounded-full border border-border/50" style={{ backgroundColor: colorInfo.hex }} />}
                          <span className="text-sm font-medium">{color}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Profil Rengi</h4>
                  <div className="px-4 py-2 rounded-xl bg-muted inline-block text-sm font-medium">
                    {recommendation.profileColor}
                  </div>
                </div>

                {recommendation.suggestedSeries && recommendation.suggestedSeries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Kumaş Serileri</h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.suggestedSeries.map((seriesId) => {
                        const series = FABRIC_SERIES.find(s => s.id === seriesId);
                        return series ? (
                          <div key={seriesId} className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm">
                            {series.name} — {series.pricePerSqm} ₺/m²
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Açıklama</h4>
                  <p className="text-sm leading-relaxed">{recommendation.reasoning}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link href="/kumas-karsilastirma">
                    <Button variant="outline" className="w-full gap-2 rounded-xl text-xs">
                      Kumaşları İncele
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href="/fiyat-hesaplama">
                    <Button className="w-full gap-2 rounded-xl btn-premium text-xs">
                      Fiyat Hesapla
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Oda bilgilerinizi girin ve renk önerisi alın</p>
                <p className="text-xs mt-2 opacity-70">Öneriler mevcut kumaş modellerimiz arasından yapılır</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mevcut Kumaş Renkleri */}
      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Mevcut Kumaş Renk Seçenekleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {FABRIC_COLOR_OPTIONS.map((color) => (
              <div key={color.name} className="flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                <div className="w-8 h-8 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: color.hex }} />
                <div>
                  <p className="text-xs font-medium">{color.name}</p>
                  <p className="text-[10px] text-muted-foreground">{color.series.length} seri</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
