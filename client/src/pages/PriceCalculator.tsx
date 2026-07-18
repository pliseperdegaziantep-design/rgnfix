import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { Calculator, ArrowRight, Package, Plus, Trash2, MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PdfExport } from "@/components/PdfExport";
import { MOUNT_TYPES, PROFILE_COLORS, FABRIC_SERIES, CASE_TYPES } from "@shared/types";
import type { MeasurementTransferPayload } from "@/features/live-measurement/rules";

interface MeasurementItem {
  id: string;
  width: string;
  height: string;
  quantity: string;
  label: string;
}

const TRANSFER_KEY = "rgnfix:measurement-transfer";

function roundToFive(cm: number): number {
  return Math.ceil(cm / 5) * 5;
}

function calculateArea(widthCm: number, heightCm: number): number {
  const roundedW = roundToFive(widthCm);
  const roundedH = roundToFive(heightCm);
  const area = (roundedW * roundedH) / 10000;
  return Math.max(area, 1);
}

function readMeasurementTransfer(params: URLSearchParams): MeasurementTransferPayload | null {
  if (params.get("from") !== "olcu-asistani" || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TRANSFER_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as MeasurementTransferPayload;
    if (payload.source !== "rgnfix-live-measurement" || !Array.isArray(payload.items) || payload.items.length === 0) return null;
    const age = Date.now() - new Date(payload.createdAt).getTime();
    if (!Number.isFinite(age) || age > 2 * 60 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export default function PriceCalculator() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const transferredPayload = useMemo(() => readMeasurementTransfer(params), [params]);

  const [measurements, setMeasurements] = useState<MeasurementItem[]>(() =>
    transferredPayload?.items.map(item => ({ ...item })) ?? [
      { id: "1", width: params.get("width") || "", height: params.get("height") || "", quantity: params.get("count") || "1", label: "Pencere 1" },
    ]
  );
  const [seriesId, setSeriesId] = useState(params.get("series") || "");
  const [mountType, setMountType] = useState(transferredPayload?.mountType || params.get("mount") || "");
  const [caseType, setCaseType] = useState(transferredPayload?.caseType || params.get("case") || "kalin");
  const [profileColor, setProfileColor] = useState(params.get("profile") || "");
  const windowType = transferredPayload?.applicationArea || params.get("window") || "";

  const selectedSeries = FABRIC_SERIES.find(series => series.id === seriesId);
  const selectedCase = CASE_TYPES.find(caseOption => caseOption.id === caseType);
  const availableProfileColors = caseType === "slim"
    ? PROFILE_COLORS.filter(color => color.id === "beyaz" || color.id === "antrasit")
    : PROFILE_COLORS;
  const hookRestricted = windowType.startsWith("pvc_") || windowType.startsWith("aluminyum_") || ["pvc-cam", "aluminyum", "standart", "balkon-kapisi", "surgulu-kapi"].includes(windowType);
  const availableMountTypes = hookRestricted ? MOUNT_TYPES.filter(type => type.id !== "kancali") : MOUNT_TYPES;

  const addMeasurement = () => {
    const newId = `${Date.now()}-${measurements.length + 1}`;
    setMeasurements(current => [...current, { id: newId, width: "", height: "", quantity: "1", label: `Pencere ${current.length + 1}` }]);
  };

  const removeMeasurement = (id: string) => {
    if (measurements.length <= 1) return;
    setMeasurements(current => current.filter(measurement => measurement.id !== id));
  };

  const updateMeasurement = (id: string, field: keyof MeasurementItem, value: string) => {
    setMeasurements(current => current.map(measurement => measurement.id === id ? { ...measurement, [field]: value } : measurement));
  };

  const calculation = useMemo(() => {
    if (!selectedSeries || !mountType) return null;

    let totalArea = 0;
    let totalFabricPrice = 0;
    let totalCaseSurcharge = 0;
    let totalQuantity = 0;
    const itemDetails: Array<{
      label: string;
      width: number;
      height: number;
      roundedW: number;
      roundedH: number;
      area: number;
      qty: number;
      price: number;
    }> = [];

    for (const measurement of measurements) {
      const width = Number(String(measurement.width).replace(",", "."));
      const height = Number(String(measurement.height).replace(",", "."));
      const quantity = Number.parseInt(measurement.quantity, 10) || 1;
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;

      const roundedW = roundToFive(width);
      const roundedH = roundToFive(height);
      const area = calculateArea(width, height);
      const fabricPrice = area * selectedSeries.pricePerSqm * quantity;
      const caseSurcharge = area * (selectedCase?.surchargePerSqm || 0) * quantity;

      totalArea += area * quantity;
      totalFabricPrice += fabricPrice;
      totalCaseSurcharge += caseSurcharge;
      totalQuantity += quantity;
      itemDetails.push({
        label: measurement.label,
        width,
        height,
        roundedW,
        roundedH,
        area,
        qty: quantity,
        price: fabricPrice + caseSurcharge,
      });
    }

    if (itemDetails.length === 0) return null;
    const subtotal = totalFabricPrice + totalCaseSurcharge;
    return {
      items: itemDetails,
      totalArea: totalArea.toFixed(2),
      totalFabricPrice: totalFabricPrice.toFixed(2),
      totalCaseSurcharge: totalCaseSurcharge.toFixed(2),
      subtotal: subtotal.toFixed(2),
      totalPrice: subtotal.toFixed(2),
      totalQuantity,
      isFreeShipping: subtotal >= 3000,
    };
  }, [measurements, selectedSeries, mountType, selectedCase]);

  const generateWhatsAppMessage = () => {
    if (!calculation || !selectedSeries) return "";
    let message = "🏠 *RGNFIX - Demonte Ürün Teklifi*\n\n";
    message += `📋 *Kumaş:* ${selectedSeries.name} (${selectedSeries.pricePerSqm} ₺/m²)\n`;
    message += `🔧 *Kasa:* ${selectedCase?.name || ""}\n`;
    message += `🎨 *Profil:* ${PROFILE_COLORS.find(profile => profile.id === profileColor)?.name || "Belirtilmedi"}\n`;
    message += `⚙️ *Montaj:* ${MOUNT_TYPES.find(mount => mount.id === mountType)?.name || ""}\n\n`;
    message += "📐 *Ölçüler:*\n";
    calculation.items.forEach(item => {
      message += `• ${item.label}: ${item.width}→${item.roundedW} × ${item.height}→${item.roundedH} cm (${item.area.toFixed(2)} m²) ×${item.qty}\n`;
    });
    message += `\n💰 *Toplam:* ${calculation.totalPrice} ₺\n`;
    if (calculation.isFreeShipping) message += "🚚 Kargo: Ücretsiz\n";
    return encodeURIComponent(message);
  };

  const primaryMeasurement = calculation?.items[0];
  const orderUrl = primaryMeasurement
    ? `/siparis?series=${seriesId}&mount=${mountType}&case=${caseType}&profile=${profileColor}&width=${primaryMeasurement.width}&height=${primaryMeasurement.height}&count=${primaryMeasurement.qty}&window=${windowType}`
    : "/siparis";

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Calculator className="h-3.5 w-3.5" /> Anlık Hesaplama
        </div>
        <h1 className="mb-3 text-3xl font-serif font-bold sm:text-4xl">Fiyat Hesaplama</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">Ölçü ve kumaş seçiminize göre anlık fiyat hesaplayın. Birden fazla pencere ekleyebilirsiniz.</p>
      </div>

      {transferredPayload && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div><strong>Ölçü Asistanındaki bütün üretim ölçüleri aktarıldı.</strong><br />Her kanat ayrı satırdadır. Buradaki 5’lik yuvarlama yalnızca mevcut fiyat hesaplama kuralına aittir; müşterinin net ölçü kaydı değiştirilmez.</div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader><CardTitle className="text-lg">Detaylar</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Kumaş Serisi</Label>
              <Select value={seriesId} onValueChange={setSeriesId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kumaş serisi seçin" /></SelectTrigger>
                <SelectContent>
                  {FABRIC_SERIES.map(series => <SelectItem key={series.id} value={series.id}>{series.name} — {series.pricePerSqm} ₺/m²</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kasa Tipi</Label>
                <Select value={caseType} onValueChange={value => {
                  setCaseType(value);
                  if (value === "slim" && profileColor !== "beyaz" && profileColor !== "antrasit") setProfileColor("");
                }}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CASE_TYPES.map(option => <SelectItem key={option.id} value={option.id}>{option.name}{option.surchargePerSqm > 0 ? ` (+${option.surchargePerSqm} ₺/m²)` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Montaj Tipi</Label>
                <Select value={mountType} onValueChange={setMountType}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>{availableMountTypes.map(option => <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>)}</SelectContent>
                </Select>
                {hookRestricted && <p className="text-xs text-muted-foreground">Bu uygulama alanında kancalı montaj kullanılmaz.</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Profil Rengi</Label>
              <Select value={profileColor} onValueChange={setProfileColor}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Profil rengi seçin" /></SelectTrigger>
                <SelectContent>
                  {availableProfileColors.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-full border" style={{ backgroundColor: profile.hex }} />{profile.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{caseType === "slim" ? "Slim kasa: Beyaz veya Antrasit" : "Kalın kasa: Beyaz, Krem, Gümüş Gri veya Antrasit"}</p>
            </div>

            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-base font-semibold">Ölçüler</Label>
                <Button variant="outline" size="sm" onClick={addMeasurement} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Ölçü Ekle</Button>
              </div>
              <div className="space-y-3">
                {measurements.map(measurement => {
                  const width = Number(String(measurement.width).replace(",", "."));
                  const height = Number(String(measurement.height).replace(",", "."));
                  const valid = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
                  return (
                    <div key={measurement.id} className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3">
                      <div className="flex items-center justify-between">
                        <Input value={measurement.label} onChange={event => updateMeasurement(measurement.id, "label", event.target.value)} className="h-7 w-52 border-0 bg-transparent px-0 text-xs font-medium" />
                        {measurements.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeMeasurement(measurement.id)} className="h-6 w-6 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label className="text-[10px] text-muted-foreground">Genişlik (cm)</Label><Input inputMode="decimal" placeholder="120" value={measurement.width} onChange={event => updateMeasurement(measurement.id, "width", event.target.value)} className="h-8 rounded-lg text-sm" /></div>
                        <div><Label className="text-[10px] text-muted-foreground">Yükseklik (cm)</Label><Input inputMode="decimal" placeholder="150" value={measurement.height} onChange={event => updateMeasurement(measurement.id, "height", event.target.value)} className="h-8 rounded-lg text-sm" /></div>
                        <div><Label className="text-[10px] text-muted-foreground">Adet</Label><Input type="number" min="1" value={measurement.quantity} onChange={event => updateMeasurement(measurement.id, "quantity", event.target.value)} className="h-8 rounded-lg text-sm" /></div>
                      </div>
                      {valid && <p className="text-[10px] text-muted-foreground">Fiyatlama yuvarlaması: {width}→{roundToFive(width)} × {height}→{roundToFive(height)} cm = {calculateArea(width, height).toFixed(2)} m²</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sticky top-24 h-fit border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Fiyat Özeti</CardTitle></CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  {calculation.items.map((item, index) => <div key={`${item.label}-${index}`} className="flex justify-between gap-3 text-xs"><span className="text-muted-foreground">{item.label} ({item.area.toFixed(2)}m² ×{item.qty})</span><span className="font-medium">{item.price.toFixed(0)} ₺</span></div>)}
                  {Number(calculation.totalCaseSurcharge) > 0 && <div className="border-t pt-1 text-xs text-amber-600">Slim kasa farkı dahil</div>}
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Toplam Alan</span><span className="font-medium">{calculation.totalArea} m²</span></div>
                  {calculation.isFreeShipping && <div className="flex justify-between text-xs text-green-600"><span>Kargo</span><span className="font-medium">Ücretsiz</span></div>}
                  <div className="flex justify-between border-t pt-3"><span className="font-semibold">Toplam</span><span className="text-lg font-bold text-primary">{Number(calculation.totalPrice).toLocaleString("tr-TR")} ₺</span></div>
                </div>
                <div className="space-y-2">
                  <Link href={orderUrl}><Button className="btn-premium w-full gap-2"><Package className="h-4 w-4" /> Sipariş Ver <ArrowRight className="h-4 w-4" /></Button></Link>
                  <a href={`https://wa.me/905300288903?text=${generateWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer" className="block"><Button variant="outline" className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50"><MessageCircle className="h-4 w-4" /> WhatsApp ile Gönder</Button></a>
                  <PdfExport items={calculation.items} seriesId={seriesId} mountType={mountType} caseType={caseType} profileColor={profileColor} totalPrice={calculation.totalPrice} totalArea={calculation.totalArea} isFreeShipping={calculation.isFreeShipping} />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground"><Calculator className="mx-auto mb-3 h-10 w-10 opacity-30" /><p className="text-sm">Fiyat hesaplamak için kumaş serisi, montaj tipi seçin ve ölçü girin</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 border-border/50">
        <CardHeader><CardTitle className="text-lg">Kumaş Serileri Karşılaştırma</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="px-2 py-3 text-left font-medium">Seri</th><th className="px-2 py-3 text-center font-medium">Fiyat/m²</th><th className="px-2 py-3 text-center font-medium">Opaklık</th><th className="px-2 py-3 text-center font-medium">Kalite</th><th className="px-2 py-3 text-center font-medium">Garanti</th></tr></thead>
              <tbody>{FABRIC_SERIES.map(series => <tr key={series.id} className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${seriesId === series.id ? "bg-primary/5" : ""}`} onClick={() => setSeriesId(series.id)}><td className="px-2 py-3 font-medium">{series.name}</td><td className="px-2 py-3 text-center font-semibold text-primary">{series.pricePerSqm} ₺</td><td className="px-2 py-3 text-center">%{series.opacity}</td><td className="px-2 py-3 text-center">{series.weight} gr/m²</td><td className="px-2 py-3 text-center">{series.warranty}</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">* Fiyat hesaplama sisteminde ölçüler 5'in katına yuvarlanır ve minimum hesaplama birimi 1 m²'dir.{caseType === "slim" && " Slim kasa farkı m² başına +60 ₺ eklenir."} 3.000 ₺ üzeri siparişlerde kargo ücretsizdir.</p>
        </CardContent>
      </Card>
    </div>
  );
}
