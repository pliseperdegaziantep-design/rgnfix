import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { ShoppingCart, CheckCircle2, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CASE_TYPES, MOUNT_TYPES, PROFILE_COLORS, WINDOW_TYPES } from "@shared/types";
import { formatFabricVariant, getCurrentFabricPrice, getFabricVariants, type FabricVariant } from "@shared/fabricCatalog";
import { formatCaseType } from "@shared/orderMeasurements";

type MeasurementRow = { id: string; label: string; width: string; height: string; quantity: string };
type PriceSetting = { seriesId: string; seriesName: string; basePrice: string | number; adhesiveSurcharge: string | number };

function parseCm(value: string) { return Number(String(value).replace(",", ".")) || 0; }
function normalizeWindowType(value: string) {
  const map: Record<string, string> = { cam_balkon: "cam-balkon", pvc_pencere: "pvc-cam", pvc_kapi: "balkon-kapisi", pvc_surgulu_kapi: "surgulu-kapi", aluminyum_pencere: "aluminyum", aluminyum_kapi: "aluminyum", aluminyum_surgulu_kapi: "surgulu-kapi" };
  return map[value] || value;
}
function readApiVariants(colors: unknown): FabricVariant[] {
  if (!Array.isArray(colors)) return [];
  return colors.filter((color): color is string => typeof color === "string" && color.trim().length > 0).map((color, index) => ({ code: `VR ${String(index + 1).padStart(2, "0")}`, name: color.trim() }));
}
function readMeasurements(params: URLSearchParams): MeasurementRow[] {
  const raw = params.get("measurements");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Array<{ label?: unknown; width?: unknown; height?: unknown; quantity?: unknown; qty?: unknown }>;
      const rows = Array.isArray(parsed)
        ? parsed.map((item, index) => ({
          id: String(index + 1),
          label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : `${index + 1}. Ölçü`,
          width: String(item.width ?? ""),
          height: String(item.height ?? ""),
          quantity: String(item.quantity ?? item.qty ?? "1"),
        })).filter(item => parseCm(item.width) > 0 && parseCm(item.height) > 0)
        : [];
      if (rows.length > 0) return rows;
    } catch {
      // Fall through to legacy single-measurement query params.
    }
  }
  return [{ id: "1", label: "1. Ölçü", width: params.get("width") || "", height: params.get("height") || "", quantity: params.get("count") || "1" }];
}

export default function OrderPage() {
  const { user } = useAuth();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const { data: fabrics } = trpc.fabrics.list.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();
  const [priceSettings, setPriceSettings] = useState<Record<string, PriceSetting>>({});
  const [createdOrderNumber, setCreatedOrderNumber] = useState("");
  const [measurements, setMeasurements] = useState<MeasurementRow[]>(() => readMeasurements(params));
  const [form, setForm] = useState({
    fabricId: "",
    fabricColor: params.get("fabricColor") || "",
    windowType: normalizeWindowType(params.get("window") || ""),
    profileColor: params.get("profile") || "",
    mountType: params.get("mount") || "",
    caseType: params.get("case") === "slim" ? "slim" as const : "kalin" as const,
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    customerNote: "",
  });

  useEffect(() => {
    void fetch("/api/prices", { cache: "no-store" }).then(response => response.json()).then((data: { prices?: PriceSetting[] }) => setPriceSettings(Object.fromEntries((data.prices || []).map(item => [item.seriesId, item])))).catch(() => undefined);
  }, []);

  useEffect(() => {
    const series = params.get("series");
    if (!series || form.fabricId || !fabrics?.length) return;
    const match = fabrics.find(fabric => fabric.slug === series);
    if (match) setForm(current => ({ ...current, fabricId: String(match.id) }));
  }, [fabrics, form.fabricId, params]);

  useEffect(() => {
    if (!user || user.role !== "user") return;
    setForm(current => ({
      ...current,
      customerName: current.customerName || user.name || "",
      customerPhone: current.customerPhone || user.phone || "",
      customerAddress: current.customerAddress || user.address || "",
      customerCity: current.customerCity || user.city || "",
    }));
  }, [user]);

  const selectedFabric = fabrics?.find(fabric => String(fabric.id) === form.fabricId);
  const catalogVariants = selectedFabric ? getFabricVariants(selectedFabric.slug) : [];
  const variants = catalogVariants.length ? catalogVariants : readApiVariants(selectedFabric?.colors);
  const configured = selectedFabric ? priceSettings[selectedFabric.slug] : undefined;
  const basePrice = selectedFabric ? Number(configured?.basePrice ?? getCurrentFabricPrice(selectedFabric.slug, Number(selectedFabric.pricePerSqm))) : 0;
  const adhesiveSurcharge = form.mountType === "yapisma" ? Number(configured?.adhesiveSurcharge ?? 65) : 0;
  const caseSurcharge = CASE_TYPES.find(item => item.id === form.caseType)?.surchargePerSqm || 0;
  const pricePerSqm = basePrice + adhesiveSurcharge + caseSurcharge;
  const hookRestricted = ["pvc-cam", "aluminyum", "standart", "balkon-kapisi", "surgulu-kapi"].includes(form.windowType);
  const availableMountTypes = hookRestricted ? MOUNT_TYPES.filter(item => item.id !== "kancali") : MOUNT_TYPES;
  const availableProfiles = form.caseType === "slim" ? PROFILE_COLORS.filter(item => ["beyaz", "antrasit"].includes(item.id)) : PROFILE_COLORS;

  const totalPrice = useMemo(() => measurements.reduce((sum, item) => {
    const width = parseCm(item.width);
    const height = parseCm(item.height);
    const quantity = Number.parseInt(item.quantity, 10) || 1;
    if (width <= 0 || height <= 0) return sum;
    return sum + Math.max((width * height) / 10000, 1) * pricePerSqm * quantity;
  }, 0), [measurements, pricePerSqm]);

  const updateMeasurement = (id: string, field: keyof MeasurementRow, value: string) => setMeasurements(current => current.map(item => item.id === id ? { ...item, [field]: value } : item));
  const addMeasurement = () => setMeasurements(current => [...current, { id: String(Date.now()), label: `${current.length + 1}. Ölçü`, width: "", height: "", quantity: "1" }]);
  const removeMeasurement = (id: string) => setMeasurements(current => current.length > 1 ? current.filter(item => item.id !== id) : current);

  const submit = async () => {
    if (!selectedFabric || !form.fabricColor || !form.windowType || !form.profileColor || !form.mountType || !form.customerName.trim() || !form.customerPhone.trim() || !form.customerCity.trim() || !form.customerAddress.trim()) {
      toast.error("Lütfen zorunlu alanları doldurun.");
      return;
    }
    if (!measurements.every(item => parseCm(item.width) > 0 && parseCm(item.height) > 0 && Number(item.quantity) > 0)) {
      toast.error("Bütün ölçüleri kontrol edin.");
      return;
    }
    try {
      const payloadMeasurements = measurements.map((item, index) => ({
        label: item.label.trim() || `${index + 1}. Ölçü`,
        width: parseCm(item.width),
        height: parseCm(item.height),
        quantity: Number.parseInt(item.quantity, 10) || 1,
      }));
      const first = payloadMeasurements[0];
      const totalQuantity = payloadMeasurements.reduce((sum, item) => sum + item.quantity, 0);
      const detail = payloadMeasurements.map((item, index) => `${index + 1}. ölçü: ${item.label}: ${item.width} × ${item.height} cm, ${item.quantity} adet`).join("\n");
      const result = await createOrderMutation.mutateAsync({
        fabricId: Number(form.fabricId),
        fabricName: selectedFabric.name,
        fabricColor: form.fabricColor,
        profileColor: form.profileColor,
        mountType: form.mountType,
        caseType: form.caseType,
        width: first.width,
        height: first.height,
        quantity: totalQuantity,
        measurements: payloadMeasurements,
        totalPrice,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        customerCity: form.customerCity,
        customerNote: [form.customerNote.trim(), `Uygulama alanı: ${WINDOW_TYPES.find(item => item.id === form.windowType)?.name || form.windowType}`, `Uygulanan m² fiyatı: ${pricePerSqm} TL`, detail].filter(Boolean).join("\n"),
      });
      setCreatedOrderNumber(result.orderNumber);
      toast.success(`Sipariş oluşturuldu: ${result.orderNumber}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      toast.error("Sipariş oluşturulamadı.");
    }
  };

  if (createdOrderNumber) return <div className="container max-w-xl py-16"><Card className="border-emerald-200"><CardContent className="p-8 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h1 className="mt-5 text-3xl font-bold">Siparişiniz Alındı</h1><p className="mt-2 text-muted-foreground">Sipariş numaranız</p><p className="mt-2 text-5xl font-black text-primary">{createdOrderNumber}</p><p className="mt-4 text-sm text-muted-foreground">Bu numarayı kaydedin. Üye olmadan da sipariş durumunu sorgulayabilirsiniz.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Button asChild className="gap-2"><Link href={`/siparis-sorgula`}><Search className="h-4 w-4" /> Siparişi Sorgula</Link></Button><Button variant="outline" onClick={() => { setCreatedOrderNumber(""); }}>Yeni Sipariş</Button></div></CardContent></Card></div>;

  return <div className="container max-w-4xl py-8">
    <div className="mb-8 text-center"><div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"><ShoppingCart className="h-4 w-4" /> Online Sipariş</div><h1 className="mt-4 text-3xl font-serif font-bold">Plise Perde Siparişi Oluştur</h1><p className="mt-2 text-muted-foreground">Güncel yönetici fiyatlarıyla hesaplanır. Sipariş numaraları 10000’den başlayarak sıralı ilerler.</p></div>
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card><CardHeader><CardTitle>Ürün Seçimi</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Kumaş Serisi *</Label><Select value={form.fabricId} onValueChange={value => setForm(current => ({ ...current, fabricId: value, fabricColor: "" }))}><SelectTrigger><SelectValue placeholder="Kumaş seçin" /></SelectTrigger><SelectContent>{fabrics?.map(fabric => <SelectItem key={fabric.id} value={String(fabric.id)}>{fabric.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Varyant *</Label><Select value={form.fabricColor} onValueChange={value => setForm(current => ({ ...current, fabricColor: value }))} disabled={!selectedFabric}><SelectTrigger><SelectValue placeholder="Varyant seçin" /></SelectTrigger><SelectContent>{variants.map(variant => <SelectItem key={variant.code} value={formatFabricVariant(variant)}>{formatFabricVariant(variant)}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Uygulama Alanı *</Label><Select value={form.windowType} onValueChange={value => setForm(current => ({ ...current, windowType: value, mountType: value === "pvc-cam" || value === "aluminyum" ? "" : current.mountType }))}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{WINDOW_TYPES.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Montaj Tipi *</Label><Select value={form.mountType} onValueChange={value => setForm(current => ({ ...current, mountType: value }))}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{availableMountTypes.map(item => <SelectItem key={item.id} value={item.id}>{item.name}{item.id === "yapisma" ? ` (+${Number(configured?.adhesiveSurcharge ?? 65)} TL/m²)` : ""}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Kasa Tipi *</Label><Select value={form.caseType} onValueChange={value => setForm(current => ({ ...current, caseType: value as "kalin" | "slim", profileColor: value === "slim" && !["beyaz", "antrasit"].includes(current.profileColor) ? "" : current.profileColor }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CASE_TYPES.map(item => <SelectItem key={item.id} value={item.id}>{formatCaseType(item.id)}{item.surchargePerSqm ? ` (+${item.surchargePerSqm} TL/m²)` : ""}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Profil Rengi *</Label><Select value={form.profileColor} onValueChange={value => setForm(current => ({ ...current, profileColor: value }))}><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{availableProfiles.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        </CardContent></Card>

        <Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Ölçüler</CardTitle><Button variant="outline" size="sm" onClick={addMeasurement} className="gap-2"><Plus className="h-4 w-4" /> Ölçü Ekle</Button></div></CardHeader><CardContent className="space-y-3">{measurements.map((item, index) => <div key={item.id} className="grid grid-cols-[1.2fr_1fr_1fr_90px_auto] gap-2 rounded-xl border p-3"><div><Label className="text-xs">Etiket</Label><Input value={item.label} onChange={event => updateMeasurement(item.id, "label", event.target.value)} /></div><div><Label className="text-xs">{index + 1}. En (cm)</Label><Input inputMode="decimal" value={item.width} onChange={event => updateMeasurement(item.id, "width", event.target.value)} /></div><div><Label className="text-xs">Boy (cm)</Label><Input inputMode="decimal" value={item.height} onChange={event => updateMeasurement(item.id, "height", event.target.value)} /></div><div><Label className="text-xs">Adet</Label><Input type="number" min="1" value={item.quantity} onChange={event => updateMeasurement(item.id, "quantity", event.target.value)} /></div><Button variant="ghost" size="icon" onClick={() => removeMeasurement(item.id)} className="mt-5 text-destructive"><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>

        <Card><CardHeader><CardTitle>Teslimat Bilgileri</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Ad Soyad *</Label><Input value={form.customerName} onChange={event => setForm(current => ({ ...current, customerName: event.target.value }))} /></div><div className="space-y-2"><Label>Telefon *</Label><Input inputMode="tel" value={form.customerPhone} onChange={event => setForm(current => ({ ...current, customerPhone: event.target.value }))} /></div><div className="space-y-2"><Label>Şehir *</Label><Input value={form.customerCity} onChange={event => setForm(current => ({ ...current, customerCity: event.target.value }))} /></div><div className="space-y-2"><Label>Adres *</Label><Input value={form.customerAddress} onChange={event => setForm(current => ({ ...current, customerAddress: event.target.value }))} /></div><div className="space-y-2 sm:col-span-2"><Label>Sipariş Notu</Label><Textarea value={form.customerNote} onChange={event => setForm(current => ({ ...current, customerNote: event.target.value }))} /></div></CardContent></Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-24"><CardHeader><CardTitle>Fiyat Özeti</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2 text-sm"><div className="flex justify-between"><span>Temel fiyat</span><strong>{basePrice.toLocaleString("tr-TR")} TL/m²</strong></div>{adhesiveSurcharge > 0 && <div className="flex justify-between text-amber-700"><span>Yapıştırma farkı</span><strong>+{adhesiveSurcharge} TL/m²</strong></div>}{caseSurcharge > 0 && <div className="flex justify-between text-amber-700"><span>Slim kasa farkı</span><strong>+{caseSurcharge} TL/m²</strong></div>}<div className="flex justify-between border-t pt-2"><span>Uygulanan fiyat</span><strong>{pricePerSqm.toLocaleString("tr-TR")} TL/m²</strong></div></div><div className="flex justify-between border-t pt-4"><span className="font-semibold">Toplam</span><span className="text-2xl font-bold text-primary">{Math.round(totalPrice).toLocaleString("tr-TR")} TL</span></div><Button onClick={() => void submit()} disabled={createOrderMutation.isPending || totalPrice <= 0} className="w-full h-12 gap-2"><ShoppingCart className="h-4 w-4" /> {createOrderMutation.isPending ? "Oluşturuluyor" : "Siparişi Oluştur"}</Button><p className="text-xs text-muted-foreground">Siparişiniz özel ölçü üretimidir. Bilgileri kontrol ederek onaylayın.</p></CardContent></Card>
    </div>
  </div>;
}
