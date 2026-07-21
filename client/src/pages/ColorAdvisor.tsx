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

const SERIES_VARIANTS = [
  { id: "nova", name: "Nova", variants: [
    { code: "VR 01", color: "Beyaz" }, { code: "VR 02", color: "Krem" }, { code: "VR 03", color: "Bej" },
    { code: "VR 04", color: "Açık Gri" }, { code: "VR 06", color: "Gri" }, { code: "VR 07", color: "Antrasit" },
  ] },
  { id: "neo-fashion", name: "Neo Fashion", variants: [
    { code: "VR 02", color: "Krem" }, { code: "VR 03", color: "Gri" }, { code: "VR 04", color: "Antrasit" },
    { code: "VR 06", color: "Ekru" }, { code: "VR 07", color: "Açık Gri" },
  ] },
  { id: "nano-clean", name: "Nano Clean", variants: [
    { code: "VR 01", color: "Beyaz" }, { code: "VR 02", color: "Krem" }, { code: "VR 03", color: "Gri" }, { code: "VR 04", color: "Antrasit" },
  ] },
  { id: "nano-insulation", name: "Nano Insulation", variants: [
    { code: "VR 01", color: "Krem" }, { code: "VR 02", color: "Açık Gri" }, { code: "VR 03", color: "Antrasit" },
  ] },
  { id: "nano-pro", name: "Nano Pro", variants: [
    { code: "VR 01", color: "Beyaz" }, { code: "VR 02", color: "Krem" }, { code: "VR 03", color: "Gri" }, { code: "VR 04", color: "Antrasit" },
  ] },
] as const;

const PROFILE_COLORS = ["Beyaz", "Krem", "Gümüş Gri", "Antrasit"] as const;

function getColor(id: string) { return MAIN_COLORS.find(color => color.id === id); }

function determinePalette(wallId: string, floorId: string, furnitureId: string) {
  const selected = [getColor(wallId), getColor(floorId), getColor(furnitureId)].filter(Boolean);
  const families = selected.map(color => color?.family || "");
  const darkCount = families.filter(family => family.includes("dark") || family === "dark").length;
  const warmCount = families.filter(family => family.includes("warm") || family === "natural").length;
  const coolCount = families.filter(family => family.includes("cool")).length;
  if (darkCount >= 2) return { colors: ["Beyaz", "Krem", "Açık Gri"], profile: "Antrasit" };
  if (warmCount >= 2) return { colors: ["Krem", "Ekru", "Bej"], profile: "Krem" };
  if (coolCount >= 2) return { colors: ["Açık Gri", "Gri", "Beyaz"], profile: "Gümüş Gri" };
  return { colors: ["Beyaz", "Krem", "Açık Gri"], profile: "Beyaz" };
}

function ColorSelect({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div className="space-y-2"><Label>{label} *</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="rounded-xl"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent className="max-h-72">{MAIN_COLORS.map(color => <SelectItem key={color.id} value={color.id}><div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.hex }} />{color.name}</div></SelectItem>)}</SelectContent></Select></div>;
}

export default function ColorAdvisor() {
  const [wallColor, setWallColor] = useState("");
  const [floorColor, setFloorColor] = useState("");
  const [furnitureColor, setFurnitureColor] = useState("");
  const [showResult, setShowResult] = useState(false);
  const recommendation = useMemo(() => {
    const palette = determinePalette(wallColor, floorColor, furnitureColor);
    const series = SERIES_VARIANTS.map(item => ({
      ...item,
      matches: item.variants.filter(variant => palette.colors.includes(variant.color)),
    })).filter(item => item.matches.length > 0);
    return { ...palette, series };
  }, [wallColor, floorColor, furnitureColor]);
  const ready = Boolean(wallColor && floorColor && furnitureColor);
  const resetResult = (setter: (value: string) => void) => (value: string) => { setter(value); setShowResult(false); };

  return <div className="container py-8 max-w-5xl">
    <div className="text-center mb-8"><div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"><Palette className="h-3.5 w-3.5" /> Akıllı Renk Danışmanı</div><h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Plise Perde Renk Önerici</h1><p className="text-muted-foreground max-w-xl mx-auto">Duvar, zemin ve mobilya renklerinize gerçekten uyan kumaş serilerini ve stoktaki varyant kodlarını gösterir.</p></div>
    <div className="grid lg:grid-cols-2 gap-6">
      <Card><CardHeader><CardTitle>Alan Renkleri</CardTitle></CardHeader><CardContent className="space-y-5"><ColorSelect label="Duvar Rengi" value={wallColor} onChange={resetResult(setWallColor)} placeholder="Duvar rengini seçin" /><ColorSelect label="Zemin Rengi" value={floorColor} onChange={resetResult(setFloorColor)} placeholder="Zemin rengini seçin" /><ColorSelect label="Mobilya Rengi" value={furnitureColor} onChange={resetResult(setFurnitureColor)} placeholder="Mobilya rengini seçin" /><Button onClick={() => setShowResult(true)} disabled={!ready} className="w-full gap-2"><Sparkles className="h-4 w-4" /> En Uygun Varyantları Bul</Button><div className="flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200"><Info className="h-4 w-4 text-amber-600 shrink-0" /><p className="text-xs text-amber-700">Uyumlu varyantı olmayan seri öneriye eklenmez.</p></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Önerilen Kumaş ve Varyantlar</CardTitle></CardHeader><CardContent>{showResult ? <div className="space-y-5">{recommendation.series.map(series => <div key={series.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="font-semibold">{series.name}</p><div className="mt-2 flex flex-wrap gap-2">{series.matches.map(variant => <span key={variant.code} className="rounded-lg bg-background border px-3 py-2 text-sm font-medium">{variant.code} – {variant.color}</span>)}</div></div>)}<div><p className="text-sm text-muted-foreground">Önerilen profil rengi</p><span className="mt-2 inline-block rounded-xl bg-muted px-4 py-2 font-medium">{recommendation.profile}</span></div></div> : <div className="text-center py-12 text-muted-foreground"><Palette className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Üç ana rengi seçerek öneri alın.</p></div>}</CardContent></Card>
    </div>
    <Card className="mt-8"><CardHeader><CardTitle>Mevcut Profil Renkleri</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{PROFILE_COLORS.map(color => <div key={color} className="p-3 rounded-xl border text-center text-sm font-medium">{color}</div>)}</div></CardContent></Card>
  </div>;
}
