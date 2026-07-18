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
import { formatFabricVariant, getCurrentFabricPrice, getFabricVariants } from "@shared/fabricCatalog";
import type { MeasurementTransferPayload } from "@/features/live-measurement/rules";

interface MeasurementItem {
  id: string;
  width: string;
  height: string;
  quantity: string;
  label: string;
}

const TRANSFER_KEY = "rgnfix:measurement-transfer";

function calculateArea(widthCm: number, heightCm: number): number {
  const area = (widthCm * heightCm) / 10000;
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
  const [fabricVariant, setFabricVariant] = useState(params.get("fabricColor") || "");
  const [mountType, setMountType] = useState(transferredPayload?.mountType || params.get("mount") || "");
  const [caseType, setCaseType] = useState(transferredPayload?.caseType || params.get("case") || "kalin");
  const [profileColor, setProfileColor] = useState(params.get("profile") || "");
  const windowType = transferredPayload?.applicationArea || params.get("window") || "";

  const selectedSeries = FABRIC_SERIES.find(series => series.id === seriesId);
  const selectedCase = CASE_TYPES.find(caseOption => caseOption.id === caseType);
  const variantOptions = getFabricVariants(seriesId);
  const currentPricePerSqm = selectedSeries
    ? getCurrentFabricPrice(selectedSeries.id, selectedSeries.pricePerSqm)
    : 0;
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
    if (!selectedSeries || !fabricVariant || !mountType) return null;

    let totalArea = 0;
    let totalFabricPrice = 0;
    let totalCaseSurcharge = 0;
    let totalQuantity = 0;
    const itemDetails: Array<{
      label: string;
      width: number;
      height: number;
      area: number;
      qty: number;
      price: number;
    }> = [];

    for (const measurement of measurements) {
      const width = Number(String(measurement.width).replace(",", "."));
      const height = Number(String(measurement.height).replace(",", "."));
      const quantity = Number.parseInt(measurement.quantity, 10) || 1;
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) continue;

      const area = calculateArea(width, height);
      const fabricPrice = area * currentPricePerSqm * quantity;
      const caseSurcharge = area * (selectedCase?.surchargePerSqm || 0) * quantity;

      totalArea += area * quantity;
      totalFabricPrice += fabricPrice;
      totalCaseSurcharge += caseSurcharge;
      totalQuantity += quantity;
      itemDetails.push({
        label: measurement.label,
        width,
        height,
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
  }, [measurements, selectedSeries, fabricVariant, mountType, selectedCase, currentPricePerSqm]);

  const generateWhatsAppMessage = () => {
    if (!calculation || !selectedSeries) return "";
    let message = "🏠 *RGNFIX - Demonte Ürün Teklifi*\n\n";
    message += `📋 *Kumaş:* ${selectedSeries.name}\n`;
    message += `🎨 *Varyant:* ${fabricVariant}\n`;
    message += `🔧 *Kasa:* ${selectedCase?.name || ""}\n`;
    message += `🎨 *Profil:* ${PROFILE_COLORS.find(profile => profile.id === profileColor)?.name || "Belirtilmedi"}\n`;
    message += `⚙️ *Montaj:* ${MOUNT_TYPES.find(mount => mount.id === mountType)?.name || ""}\n\n`;
    message += "📐 *Ölçüler:*\n";
    calculation.items.forEach(item => {
      message += `• ${item.label}: ${item.width} × ${item.height} cm × ${item.qty} adet\n`;
    });
    message += `\n💰 *Toplam:* ${Number(calculation.totalPrice).toLocaleString("tr-TR")} ₺\n`;
    if (calculation.isFreeShipping) message += "🚚 Kargo: Ücretsiz\n";
    return encodeURIComponent(message);
  };

  const primaryMeasurement = calculation?.items[0];
  const orderUrl = primaryMeasurement
    ? `/siparis?series=${seriesId}&fabricColor=${encodeURIComponent(fabricVariant)}&mount=${mountType}&case=${caseType}&profile=${profileColor}&width=${primaryMeasurement.width}&height=${primaryMeasurement.height}&count=${primaryMeasurement.qty}&window=${windowType}`
    : "/siparis";

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          <Calculator className="h-3.5 w-3.5" /> Anlık Fiyat
        </div>
        <h1 className="mb-3 text-3xl font-serif font-bold sm:text-4xl">Fiyat Hesaplama</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">Ölçünüzü, kumaşınızı ve varyantınızı seçerek fiyatı görün.</p>
      </div>

      {transferredPayload && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <strong>Ölçüleriniz aktarıldı.</strong>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border/50 lg:col-span-3">
          <CardHeader><CardTitle className="text-lg">Ürün Bilgileri</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kumaş Serisi</Label>
                <Select value={seriesId} onValueChange={value => {
                  setSeriesId(value);
                  setFabricVariant("");
                }}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Kumaş serisi seçin" /></SelectTrigger>
                  <SelectContent>
                    {FABRIC_SERIES.map(series => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.name} — {getCurrentFabricPrice(series.id, series.pricePerSqm)} ₺/m²
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kumaş Varyantı</Label>
                <Select value={fabricVariant} onValueChange={setFabricVariant} disabled={!seriesId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder={seriesId ? "Varyant seçin" : "Önce kumaş seçin"} /></SelectTrigger>
                  <SelectContent>
                    {variantOptions.map(variant => (
                      <SelectItem key={variant.code} value={formatFabricVariant(variant)}>{formatFabricVariant(variant)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>

            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-base font-semibold">Ölçüler</Label>
                <Button variant="outline" size="sm" onClick={addMeasurement} className="gap-1 text-xs"><Plus className="h-3 w-3" /> Ölçü Ekle</Button>
              </div>
              <div className="space-y-3">
                {measurements.map(measurement => (
                  <div key={measurement.id} className="space-y-2 rounded-xl border border-border/50 bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <Input value={measurement.label} onChange={event => updateMeasurement(measurement.id, "label", event.target.value)} className="h-7 w-52 border-0 bg-transparent px-0 text-xs font-medium" />
                      {measurements.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeMeasurement(measurement.id)} className="h-6 w-6 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div><Label className="text-[10px] text-muted-foreground">En (cm)</Label><Input inputMode="decimal" placeholder="51" value={measurement.width} onChange={event => updateMeasurement(measurement.id, "width", event.target.value)} className="h-9 rounded-lg text-sm" /></div>
                      <div><Label className="text-[10px] text-muted-foreground">Boy (cm)</Label><Input inputMode="decimal" placeholder="150" value={measurement.height} onChange={event => updateMeasurement(measurement.id, "height", event.target.value)} className="h-9 rounded-lg text-sm" /></div>
                      <div><Label className="text-[10px] text-muted-foreground">Adet</Label><Input type="number" min="1" value={measurement.quantity} onChange={event => updateMeasurement(measurement.id, "quantity", event.target.value)} className="h-9 rounded-lg text-sm" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sticky top-24 h-fit border-border/50 lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Fiyat</CardTitle></CardHeader>
          <CardContent>
            {calculation ? (
              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  {calculation.items.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">{item.label} · {item.qty} adet</span>
                      <span className="font-medium">{Math.round(item.price).toLocaleString("tr-TR")} ₺</span>
                    </div>
                  ))}
                  {Number(calculation.totalCaseSurcharge) > 0 && <div className="border-t pt-1 text-xs text-amber-600">Slim kasa farkı dahil</div>}
                  {calculation.isFreeShipping && <div className="flex justify-between text-xs text-green-600"><span>Kargo</span><span className="font-medium">Ücretsiz</span></div>}
                  <div className="flex justify-between border-t pt-3"><span className="font-semibold">Toplam</span><span className="text-2xl font-bold text-primary">{Number(calculation.totalPrice).toLocaleString("tr-TR")} ₺</span></div>
                </div>
                <div className="space-y-2">
                  <Link href={orderUrl}><Button className="btn-premium w-full gap-2"><Package className="h-4 w-4" /> Sipariş Ver <ArrowRight className="h-4 w-4" /></Button></Link>
                  <a href={`https://wa.me/905300288903?text=${generateWhatsAppMessage()}`} target="_blank" rel="noopener noreferrer" className="block"><Button variant="outline" className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50"><MessageCircle className="h-4 w-4" /> WhatsApp ile Gönder</Button></a>
                  <PdfExport items={calculation.items} seriesId={seriesId} mountType={mountType} caseType={caseType} profileColor={profileColor} totalPrice={calculation.totalPrice} totalArea={calculation.totalArea} isFreeShipping={calculation.isFreeShipping} />
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground"><Calculator className="mx-auto mb-3 h-10 w-10 opacity-30" /><p className="text-sm">Kumaş, varyant, montaj tipi ve ölçü bilgilerini girin.</p></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
