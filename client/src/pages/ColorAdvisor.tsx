import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sparkles, Info } from "lucide-react";

const APPLICATION_COLORS = [
  { id: "beyaz", name: "Beyaz", hex: "#FFFFFF" },
  { id: "krem", name: "Krem", hex: "#F5F0E0" },
  { id: "gumus-gri", name: "Gümüş Gri", hex: "#C0C0C0" },
  { id: "gri", name: "Gri", hex: "#8A8A8A" },
  { id: "antrasit", name: "Antrasit", hex: "#383838" },
  { id: "siyah", name: "Siyah", hex: "#1A1A1A" },
  { id: "bronz", name: "Bronz", hex: "#8C6239" },
  { id: "kahve", name: "Kahve", hex: "#6B4226" },
  { id: "ahsap", name: "Ahşap Tonu", hex: "#8B5A2B" },
];

const FABRIC_SERIES = [
  { id: "nova", name: "Nova", codes: "VR01–VR10", colors: ["Beyaz", "Krem", "Bej", "Açık Gri"] },
  { id: "neo-fashion", name: "Neo Fashion", codes: "VR04, VR05, VR06", colors: ["Krem", "Bej", "Gri", "Antrasit"] },
  { id: "nano-clean", name: "Nano Clean", codes: "VR01, VR03, VR04", colors: ["Beyaz", "Krem", "Açık Gri", "Gri"] },
  { id: "nano-insulation", name: "Nano Insulation", codes: "Karteladaki varyant kodları", colors: ["Krem", "Bej", "Gri", "Antrasit"] },
  { id: "nano-pro", name: "Nano Pro", codes: "VR01, VR03, VR04", colors: ["Beyaz", "Bej", "Antrasit", "Siyah"] },
  { id: "honeycomb", name: "Honeycomb", codes: "VR01, VR02, VR03, VR05", colors: ["Beyaz", "Krem", "Gri", "Antrasit"] },
];

const PROFILE_COLORS = ["Beyaz", "Krem", "Gümüş Gri", "Antrasit"] as const;

function chooseProfile(applicationColor: string, fabricColors: string[]) {
  if (applicationColor === "beyaz") return "Beyaz";
  if (applicationColor === "krem") return "Krem";
  if (applicationColor === "gumus-gri" || applicationColor === "gri") return "Gümüş Gri";
  if (applicationColor === "antrasit" || applicationColor === "siyah") return "Antrasit";

  const firstFabric = fabricColors[0] || "Krem";
  if (["Antrasit", "Siyah", "Gri"].includes(firstFabric)) return "Antrasit";
  if (["Krem", "Bej"].includes(firstFabric)) return "Krem";
  return "Beyaz";
}

function chooseColors(applicationColor: string, seriesColors: string[]) {
  const preferred = applicationColor === "beyaz"
    ? ["Beyaz", "Krem", "Açık Gri"]
    : applicationColor === "krem" || applicationColor === "bronz" || applicationColor === "kahve" || applicationColor === "ahsap"
      ? ["Krem", "Bej", "Antrasit"]
      : ["Gri", "Antrasit", "Beyaz"];

  const matching = preferred.filter(color => seriesColors.includes(color));
  return matching.length > 0 ? matching : seriesColors.slice(0, 3);
}

export default function ColorAdvisor() {
  const [applicationColor, setApplicationColor] = useState("");
  const [seriesId, setSeriesId] = useState("nova");
  const [showResult, setShowResult] = useState(false);

  const selectedSeries = useMemo(
    () => FABRIC_SERIES.find(series => series.id === seriesId) || FABRIC_SERIES[0],
    [seriesId],
  );

  const fabricColors = chooseColors(applicationColor, selectedSeries.colors);
  const profileColor = chooseProfile(applicationColor, fabricColors);
  const application = APPLICATION_COLORS.find(color => color.id === applicationColor);
  const isUnsupportedProfile = ["bronz", "kahve", "ahsap", "siyah"].includes(applicationColor);

  return (
    <div className="container py-8 max-w-5xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Palette className="h-3.5 w-3.5" />
          Renk Danışmanı
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Renk Danışmanı</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Uygulama alanına uygun kumaş ve profil rengini seçin.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Ürün Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Cam Balkon / Uygulama Alanı Rengi *</Label>
              <Select value={applicationColor} onValueChange={(value) => { setApplicationColor(value); setShowResult(false); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Uygulama alanının rengini seçin" />
                </SelectTrigger>
                <SelectContent>
                  {APPLICATION_COLORS.map(color => (
                    <SelectItem key={color.id} value={color.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: color.hex }} />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kumaş Serisi</Label>
              <Select value={seriesId} onValueChange={(value) => { setSeriesId(value); setShowResult(false); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FABRIC_SERIES.map(series => (
                    <SelectItem key={series.id} value={series.id}>{series.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="button" onClick={() => setShowResult(true)} disabled={!applicationColor} className="w-full btn-premium gap-2">
              <Sparkles className="h-4 w-4" /> Renk Önerisi Al
            </Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">Profil renkleri yalnızca Beyaz, Krem, Gümüş Gri ve Antrasittir.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Öneri</CardTitle>
          </CardHeader>
          <CardContent>
            {showResult ? (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Kumaş Serisi ve Kodları</h4>
                  <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="font-semibold">{selectedSeries.name}</p>
                    <p className="text-sm text-muted-foreground">Kodlar: {selectedSeries.codes}</p>
                    {seriesId === "nano-pro" && <p className="text-xs mt-1">VR03 ve VR04 karartma kumaştır.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Kumaş Renkleri</h4>
                  <div className="flex flex-wrap gap-2">
                    {fabricColors.map(color => (
                      <div key={color} className="px-3 py-2 rounded-xl bg-muted text-sm font-medium">{color}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Profil Rengi</h4>
                  <div className="px-4 py-2 rounded-xl bg-muted inline-block text-sm font-medium">{profileColor}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Açıklama</h4>
                  <p className="text-sm leading-relaxed">
                    {isUnsupportedProfile
                      ? `${application?.name} profilimiz yok; kumaşa en yakın ${profileColor} profil önerilir.`
                      : `Uygulama alanına en uyumlu profil rengi ${profileColor}.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Uygulama alanı rengini seçin.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Mevcut Profil Renkleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROFILE_COLORS.map(color => <div key={color} className="p-3 rounded-xl border border-border/50 text-center text-sm font-medium">{color}</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
