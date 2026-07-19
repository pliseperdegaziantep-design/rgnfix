import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sparkles, Info } from "lucide-react";

const MAIN_COLORS = [
  { id: "beyaz", name: "Beyaz", hex: "#FFFFFF", family: "light" },
  { id: "krem", name: "Krem", hex: "#F5F0E0", family: "warm-light" },
  { id: "bej", name: "Bej", hex: "#D4C5A9", family: "warm" },
  { id: "kahve", name: "Kahve", hex: "#6B4226", family: "warm-dark" },
  { id: "gri", name: "Gri", hex: "#9CA3AF", family: "cool" },
  { id: "acik-gri", name: "Açık Gri", hex: "#D3D3D3", family: "cool-light" },
  { id: "antrasit", name: "Antrasit", hex: "#383838", family: "cool-dark" },
  { id: "siyah", name: "Siyah", hex: "#1A1A1A", family: "dark" },
  { id: "lacivert", name: "Lacivert", hex: "#18233A", family: "cool-dark" },
  { id: "mavi", name: "Mavi", hex: "#4F7CAC", family: "cool" },
  { id: "yesil", name: "Yeşil", hex: "#5F7F63", family: "natural" },
  { id: "bordo", name: "Bordo", hex: "#7A263A", family: "warm-dark" },
  { id: "sari", name: "Sarı", hex: "#D8B84A", family: "warm" },
  { id: "bronz", name: "Bronz", hex: "#8C6239", family: "warm-dark" },
  { id: "ahsap", name: "Ahşap Tonu", hex: "#8B5A2B", family: "natural" },
] as const;

const FABRIC_SERIES = [
  { id: "nova", name: "Nova", codes: "VR01–VR10", colors: ["Beyaz", "Krem", "Bej", "Açık Gri"], level: 1 },
  { id: "neo-fashion", name: "Neo Fashion", codes: "VR04, VR05, VR06", colors: ["Krem", "Bej", "Gri", "Antrasit"], level: 2 },
  { id: "nano-clean", name: "Nano Clean", codes: "VR01, VR03, VR04", colors: ["Beyaz", "Krem", "Açık Gri", "Gri"], level: 2 },
  { id: "nano-insulation", name: "Nano Insulation", codes: "Karteladaki mevcut varyantlar", colors: ["Krem", "Bej", "Gri", "Antrasit"], level: 3 },
  { id: "nano-pro", name: "Nano Pro", codes: "VR01, VR03, VR04", colors: ["Beyaz", "Bej", "Antrasit", "Siyah"], level: 4 },
  { id: "honeycomb", name: "Honeycomb", codes: "VR01, VR02, VR03, VR05", colors: ["Beyaz", "Krem", "Gri", "Antrasit"], level: 4 },
] as const;

const PROFILE_COLORS = ["Beyaz", "Krem", "Gümüş Gri", "Antrasit"] as const;

type MainColorId = typeof MAIN_COLORS[number]["id"];

function getColor(id: string) {
  return MAIN_COLORS.find(color => color.id === id);
}

function determinePalette(wallId: string, floorId: string, furnitureId: string) {
  const selected = [getColor(wallId), getColor(floorId), getColor(furnitureId)].filter(Boolean);
  const families = selected.map(color => color?.family || "");
  const darkCount = families.filter(family => family.includes("dark") || family === "dark").length;
  const warmCount = families.filter(family => family.includes("warm") || family === "natural").length;
  const coolCount = families.filter(family => family.includes("cool")).length;

  if (darkCount >= 2) return { colors: ["Beyaz", "Krem", "Açık Gri"], profile: "Antrasit", series: ["neo-fashion", "nano-pro"] };
  if (warmCount >= 2) return { colors: ["Krem", "Bej", "Antrasit"], profile: "Krem", series: ["nova", "neo-fashion", "nano-insulation"] };
  if (coolCount >= 2) return { colors: ["Açık Gri", "Gri", "Beyaz"], profile: "Gümüş Gri", series: ["nova", "nano-clean", "nano-pro"] };
  return { colors: ["Beyaz", "Krem", "Bej"], profile: "Beyaz", series: ["nova", "neo-fashion", "nano-clean"] };
}

function chooseProfile(applicationColor: string, fallback: string) {
  if (applicationColor === "beyaz") return "Beyaz";
  if (applicationColor === "krem") return "Krem";
  if (["gri", "acik-gri"].includes(applicationColor)) return "Gümüş Gri";
  if (["antrasit", "siyah", "lacivert"].includes(applicationColor)) return "Antrasit";
  return fallback;
}

function ColorSelect({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? " *" : ""}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent className="max-h-72">
          {MAIN_COLORS.map(color => (
            <SelectItem key={color.id} value={color.id}>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: color.hex }} />
                {color.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ColorAdvisor() {
  const [wallColor, setWallColor] = useState("");
  const [floorColor, setFloorColor] = useState("");
  const [furnitureColor, setFurnitureColor] = useState("");
  const [applicationColor, setApplicationColor] = useState("");
  const [showResult, setShowResult] = useState(false);

  const recommendation = useMemo(() => {
    const result = determinePalette(wallColor, floorColor, furnitureColor);
    const profile = chooseProfile(applicationColor, result.profile);
    const series = result.series
      .map(id => FABRIC_SERIES.find(item => item.id === id))
      .filter((item): item is typeof FABRIC_SERIES[number] => Boolean(item));
    return { ...result, profile, series };
  }, [wallColor, floorColor, furnitureColor, applicationColor]);

  const application = getColor(applicationColor);
  const unsupportedProfile = ["kahve", "bronz", "ahsap", "bordo", "yesil", "mavi", "sari"].includes(applicationColor);
  const ready = Boolean(wallColor && floorColor && furnitureColor);

  const resetResult = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setShowResult(false);
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"><Palette className="h-3.5 w-3.5" /> AI Destekli Renk Danışmanı</div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Renk Danışmanı</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">Duvar, zemin ve mobilya renklerinize göre uygun kumaş serisini belirleyelim.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-lg">Alan Renkleri</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <ColorSelect label="Duvar Rengi" value={wallColor} onChange={resetResult(setWallColor)} placeholder="Duvar rengini seçin" required />
            <ColorSelect label="Zemin Rengi" value={floorColor} onChange={resetResult(setFloorColor)} placeholder="Zemin rengini seçin" required />
            <ColorSelect label="Mobilya Rengi" value={furnitureColor} onChange={resetResult(setFurnitureColor)} placeholder="Mobilya rengini seçin" required />
            <ColorSelect label="Cam Balkon / Uygulama Alanı Rengi" value={applicationColor} onChange={resetResult(setApplicationColor)} placeholder="Profil önerisi için seçin" />

            <Button type="button" onClick={() => setShowResult(true)} disabled={!ready} className="w-full btn-premium gap-2"><Sparkles className="h-4 w-4" /> En Uygun Rengi Bul</Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">Öneriler yalnızca kendi kumaş serilerimizden ve mevcut profil renklerimizden yapılır.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 h-fit">
          <CardHeader><CardTitle className="text-lg">AI Önerisi</CardTitle></CardHeader>
          <CardContent>
            {showResult ? (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Kumaş Renkleri</h4>
                  <div className="flex flex-wrap gap-2">{recommendation.colors.map(color => <span key={color} className="px-3 py-2 rounded-xl bg-muted text-sm font-medium">{color}</span>)}</div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Kumaş Serileri</h4>
                  <div className="space-y-2">
                    {recommendation.series.map(series => (
                      <div key={series.id} className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="font-semibold">{series.name}</p>
                        <p className="text-sm text-muted-foreground">Kodlar: {series.codes}</p>
                        {series.id === "nano-pro" && <p className="text-xs mt-1">VR03 ve VR04 karartma kumaştır.</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Önerilen Profil Rengi</h4>
                  <span className="inline-block px-4 py-2 rounded-xl bg-muted text-sm font-medium">{recommendation.profile}</span>
                </div>

                <p className="text-sm text-muted-foreground">
                  {unsupportedProfile && application
                    ? `${application.name} profilimiz yok; kumaş rengine en yakın ${recommendation.profile} profil önerilir.`
                    : "Renkler alanınızdaki ana tonların uyumuna göre belirlendi."}
                </p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground"><Palette className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="text-sm">Üç ana rengi seçerek öneri alın.</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader><CardTitle className="text-lg">Mevcut Profil Renkleri</CardTitle></CardHeader>
        <CardContent><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{PROFILE_COLORS.map(color => <div key={color} className="p-3 rounded-xl border border-border/50 text-center text-sm font-medium">{color}</div>)}</div></CardContent>
      </Card>
    </div>
  );
}
