import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight, Package, Plus, Trash2, MessageCircle } from "lucide-react";
import { PdfExport } from "@/components/PdfExport";
import { MOUNT_TYPES, PROFILE_COLORS, FABRIC_SERIES, CASE_TYPES } from "@shared/types";
import { Link, useSearch } from "wouter";

interface MeasurementItem {
  id: string;
  width: string;
  height: string;
  quantity: string;
  label: string;
}

// Yuvarlama kuralı: 5'in katına yuvarla (65→70, 78→80, 123→125)
function roundToFive(cm: number): number {
  return Math.ceil(cm / 5) * 5;
}

// m² hesaplama: minimum 1 m², üstü birim fiyatla çarpılır
function calculateArea(widthCm: number, heightCm: number): number {
  const roundedW = roundToFive(widthCm);
  const roundedH = roundToFive(heightCm);
  const area = (roundedW * roundedH) / 10000;
  return Math.max(area, 1); // minimum 1 m²
}

export default function PriceCalculator() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const [measurements, setMeasurements] = useState<MeasurementItem[]>([
    { id: "1", width: params.get("width") || "", height: params.get("height") || "", quantity: params.get("count") || "1", label: "Pencere 1" },
  ]);
  const [seriesId, setSeriesId] = useState(params.get("series") || "");
  const [mountType, setMountType] = useState(params.get("mount") || "");
  const [caseType, setCaseType] = useState(params.get("case") || "kalin");
  const [profileColor, setProfileColor] = useState(params.get("profile") || "");
  const windowType = params.get("window") || "";

  const selectedSeries = FABRIC_SERIES.find((s) => s.id === seriesId);
  const selectedCase = CASE_TYPES.find((c) => c.id === caseType);
  const availableProfileColors = caseType === "slim"
    ? PROFILE_COLORS.filter((color) => color.id === "beyaz" || color.id === "antrasit")
    : PROFILE_COLORS;

  const addMeasurement = () => {
    const newId = String(measurements.length + 1);
    setMeasurements([...measurements, { id: newId, width: "", height: "", quantity: "1", label: `Pencere ${newId}` }]);
  };

  const removeMeasurement = (id: string) => {
    if (measurements.length <= 1) return;
    setMeasurements(measurements.filter((m) => m.id !== id));
  };

  const updateMeasurement = (id: string, field: keyof MeasurementItem, value: string) => {
    setMeasurements(measurements.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculation = useMemo(() => {
    if (!selectedSeries || !mountType) return null;

    let totalArea = 0;
    let totalFabricPrice = 0;
    let totalCaseSurcharge = 0;
    let totalQuantity = 0;
    const itemDetails: { label: string; width: number; height: number; roundedW: number; roundedH: number; area: number; qty: number; price: number }[] = [];

    for (const m of measurements) {
      const w = parseFloat(m.width);
      const h = parseFloat(m.height);
      const qty = parseInt(m.quantity) || 1;
      if (!w || !h || w <= 0 || h <= 0) continue;

      const roundedW = roundToFive(w);
      const roundedH = roundToFive(h);
      const area = calculateArea(w, h);
      const fabricPrice = area * selectedSeries.pricePerSqm * qty;
      const caseSurcharge = area * (selectedCase?.surchargePerSqm || 0) * qty;

      totalArea += area * qty;
      totalFabricPrice += fabricPrice;
      totalCaseSurcharge += caseSurcharge;
      totalQuantity += qty;

      itemDetails.push({ label: m.label, width: w, height: h, roundedW, roundedH, area, qty, price: fabricPrice + caseSurcharge });
    }

    if (itemDetails.length === 0) return null;

    const subtotal = totalFabricPrice + totalCaseSurcharge;
    // Kargo: 3000₺ üzeri ücretsiz (kargo fiyatı gösterilmez)
    const isFreeShipping = subtotal >= 3000;
    const totalPrice = subtotal;

    return {
      items: itemDetails,
      totalArea: totalArea.toFixed(2),
      totalFabricPrice: totalFabricPrice.toFixed(2),
      totalCaseSurcharge: totalCaseSurcharge.toFixed(2),
      subtotal: subtotal.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      totalQuantity,
      isFreeShipping,
    };
  }, [measurements, selectedSeries, mountType, caseType, selectedCase]);

  const generateWhatsAppMessage = () => {
    if (!calculation || !selectedSeries) return "";
    let msg = `🏠 *RGNFIX - Demonte Ürün Teklifi*\n\n`;
    msg += `📋 *Kumaş:* ${selectedSeries.name} (${selectedSeries.pricePerSqm} ₺/m²)\n`;
    msg += `🔧 *Kasa:* ${selectedCase?.name || ""}\n`;
    msg += `🎨 *Profil:* ${PROFILE_COLORS.find(p => p.id === profileColor)?.name || "Belirtilmedi"}\n`;
    msg += `⚙️ *Montaj:* ${MOUNT_TYPES.find(m => m.id === mountType)?.name || ""}\n\n`;
    msg += `📐 *Ölçüler:*\n`;
    calculation.items.forEach((item) => {
      msg += `• ${item.label}: ${item.width}→${item.roundedW} x ${item.height}→${item.roundedH} cm (${item.area.toFixed(2)} m²) x${item.qty}\n`;
    });
    msg += `\n💰 *Toplam:* ${calculation.totalPrice} ₺\n`;
    if (calculation.isFreeShipping) msg += `🚚 Kargo: Ücretsiz\n`;
    return encodeURIComponent(msg);
  };

  const primaryMeasurement = calculation?.items[0];
  const orderUrl = primaryMeasurement
    ? `/siparis?series=${seriesId}&mount=${mountType}&case=${caseType}&profile=${profileColor}&width=${primaryMeasurement.width}&height=${primaryMeasurement.height}&count=${primaryMeasurement.qty}&window=${windowType}`
    : "/siparis";

  return (
    <div className="container py-8 max-w-5xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Calculator className="h-3.5 w-3.5" />
          Anlık Hesaplama
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Fiyat Hesaplama</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Ölçü ve kumaş seçiminize göre anlık fiyat hesaplayın. Birden fazla pencere ekleyebilirsiniz.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="lg:col-span-3 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Kumaş ve Ayarlar */}
            <div className="space-y-2">
              <Label>Kumaş Serisi</Label>
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Kumaş serisi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {FABRIC_SERIES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.pricePerSqm} ₺/m²
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kasa Tipi</Label>
                <Select
                  value={caseType}
                  onValueChange={(value) => {
                    setCaseType(value);
                    if (value === "slim" && profileColor !== "beyaz" && profileColor !== "antrasit") {
                      setProfileColor("");
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_TYPES.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.name}{ct.surchargePerSqm > 0 ? ` (+${ct.surchargePerSqm} ₺/m²)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montaj Tipi</Label>
                <Select value={mountType} onValueChange={setMountType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOUNT_TYPES.map((mt) => (
                      <SelectItem key={mt.id} value={mt.id}>{mt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profil Rengi</Label>
              <Select value={profileColor} onValueChange={setProfileColor}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Profil rengi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableProfileColors.map((pc) => (
                    <SelectItem key={pc.id} value={pc.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: pc.hex }} />
                        {pc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {caseType === "slim" ? "Slim kasa: Beyaz veya Antrasit" : "Kalın kasa: Beyaz, Krem, Gümüş Gri veya Antrasit"}
              </p>
            </div>

            {/* Ölçüler */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Ölçüler</Label>
                <Button variant="outline" size="sm" onClick={addMeasurement} className="gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Ölçü Ekle
                </Button>
              </div>

              <div className="space-y-3">
                {measurements.map((m, idx) => (
                  <div key={m.id} className="p-3 rounded-xl border border-border/50 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <Input
                        value={m.label}
                        onChange={(e) => updateMeasurement(m.id, "label", e.target.value)}
                        className="h-7 text-xs font-medium w-32 border-0 bg-transparent px-0"
                      />
                      {measurements.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeMeasurement(m.id)} className="h-6 w-6 p-0 text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Genişlik (cm)</Label>
                        <Input type="number" placeholder="120" value={m.width} onChange={(e) => updateMeasurement(m.id, "width", e.target.value)} className="h-8 text-sm rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Yükseklik (cm)</Label>
                        <Input type="number" placeholder="150" value={m.height} onChange={(e) => updateMeasurement(m.id, "height", e.target.value)} className="h-8 text-sm rounded-lg" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Adet</Label>
                        <Input type="number" min="1" value={m.quantity} onChange={(e) => updateMeasurement(m.id, "quantity", e.target.value)} className="h-8 text-sm rounded-lg" />
                      </div>
                    </div>
                    {m.width && m.height && parseFloat(m.width) > 0 && parseFloat(m.height) > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Yuvarlama: {m.width}→{roundToFive(parseFloat(m.width))} x {m.height}→{roundToFive(parseFloat(m.height))} cm = {calculateArea(parseFloat(m.width), parseFloat(m.height)).toFixed(2)} m²
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="lg:col-span-2 border-border/50 h-fit sticky top-24">
          <CardHeader>
            <CardTitle className="text-lg">Fiyat Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  {calculation.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{item.label} ({item.area.toFixed(2)}m² x{item.qty})</span>
                      <span className="font-medium">{item.price.toFixed(0)} ₺</span>
                    </div>
                  ))}
                  {parseFloat(calculation.totalCaseSurcharge) > 0 && (
                    <div className="flex justify-between text-xs border-t pt-1">
                      <span className="text-amber-600">Slim Kasa Farkı dahil</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Toplam Alan</span>
                    <span className="font-medium">{calculation.totalArea} m²</span>
                  </div>
                  {calculation.isFreeShipping && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Kargo</span>
                      <span className="font-medium">Ücretsiz</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Toplam</span>
                    <span className="font-bold text-lg text-primary">{parseFloat(calculation.totalPrice).toLocaleString("tr-TR")} ₺</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href={orderUrl}>
                    <Button className="w-full btn-premium gap-2">
                      <Package className="h-4 w-4" />
                      Sipariş Ver
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>

                  <a
                    href={`https://wa.me/905300288903?text=${generateWhatsAppMessage()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp ile Gönder
                    </Button>
                  </a>

                  <PdfExport
                    items={calculation.items}
                    seriesId={seriesId}
                    mountType={mountType}
                    caseType={caseType}
                    profileColor={profileColor}
                    totalPrice={calculation.totalPrice}
                    totalArea={calculation.totalArea}
                    isFreeShipping={calculation.isFreeShipping}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calculator className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Fiyat hesaplamak için kumaş serisi, montaj tipi seçin ve ölçü girin</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Series Comparison Table */}
      <Card className="mt-8 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Kumaş Serileri Karşılaştırma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Seri</th>
                  <th className="text-center py-3 px-2 font-medium">Fiyat/m²</th>
                  <th className="text-center py-3 px-2 font-medium">Opaklık</th>
                  <th className="text-center py-3 px-2 font-medium">Kalite</th>
                  <th className="text-center py-3 px-2 font-medium">Garanti</th>
                </tr>
              </thead>
              <tbody>
                {FABRIC_SERIES.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${seriesId === s.id ? "bg-primary/5" : ""}`}
                    onClick={() => setSeriesId(s.id)}
                  >
                    <td className="py-3 px-2 font-medium">{s.name}</td>
                    <td className="text-center py-3 px-2 text-primary font-semibold">{s.pricePerSqm} ₺</td>
                    <td className="text-center py-3 px-2">%{s.opacity}</td>
                    <td className="text-center py-3 px-2">{s.weight} gr/m²</td>
                    <td className="text-center py-3 px-2">{s.warranty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            * Ölçüler 5'in katına yuvarlanır (65→70, 78→80). Minimum hesaplama birimi 1 m²'dir.
            {caseType === "slim" && " Slim kasa farkı m² başına +60 ₺ eklenir."}
            {" "}3.000 ₺ üzeri siparişlerde kargo ücretsizdir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
