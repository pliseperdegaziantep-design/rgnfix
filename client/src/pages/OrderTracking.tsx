import { useState } from "react";
import { Search, PackageCheck, Clock3, Factory, Truck, CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCaseType, formatMeasurementLine, normalizeOrderMeasurements } from "@shared/orderMeasurements";

const statusLabels: Record<string, string> = {
  pending: "Onay Bekliyor",
  confirmed: "Onaylandı",
  production: "Üretimde",
  preparing: "Hazırlanıyor",
  shipping: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const statusIcons: Record<string, typeof Clock3> = {
  pending: Clock3,
  confirmed: PackageCheck,
  production: Factory,
  preparing: PackageCheck,
  shipping: Truck,
  delivered: CircleCheckBig,
  cancelled: Clock3,
};

type TrackedOrder = {
  orderNumber: string;
  status: string;
  fabricName?: string;
  fabricColor?: string;
  profileColor?: string;
  mountType?: string;
  caseType?: string;
  width?: string | number;
  height?: string | number;
  quantity?: number;
  measurements?: unknown;
  totalPrice?: string | number;
  createdAt?: string;
  updatedAt?: string;
};

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchOrder = async () => {
    const normalized = orderNumber.replace(/\D/g, "");
    if (normalized.length < 5) {
      setError("Geçerli sipariş numarasını girin.");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const response = await fetch(`/api/orders/track/${normalized}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({})) as { order?: TrackedOrder; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || "Sipariş bulunamadı.");
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sipariş sorgulanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const Icon = order ? (statusIcons[order.status] || PackageCheck) : Search;

  return <div className="container max-w-2xl py-10 sm:py-16">
    <div className="text-center mb-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Search className="h-7 w-7" /></div>
      <h1 className="mt-4 text-3xl font-serif font-bold">Sipariş Sorgulama</h1>
      <p className="mt-2 text-muted-foreground">Üye girişi yapmadan sipariş numaranızla güncel durumu öğrenin.</p>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-lg">Sipariş numaranızı girin</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="order-number">Sipariş Numarası</Label><div className="flex gap-2"><Input id="order-number" inputMode="numeric" placeholder="Örn: 10000" value={orderNumber} onChange={event => setOrderNumber(event.target.value.replace(/\D/g, ""))} onKeyDown={event => { if (event.key === "Enter") void searchOrder(); }} className="h-12 text-lg" /><Button onClick={() => void searchOrder()} disabled={loading} className="h-12 gap-2"><Search className="h-4 w-4" /> {loading ? "Sorgulanıyor" : "Sorgula"}</Button></div></div>
        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </CardContent>
    </Card>

    {order && <Card className="mt-5 border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div><div><p className="text-xs text-muted-foreground">Sipariş #{order.orderNumber}</p><h2 className="text-xl font-bold">{statusLabels[order.status] || order.status}</h2></div></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-muted-foreground">Ürün</p><p className="mt-1 font-semibold">{order.fabricName || "Plise Perde"}</p><p>{order.fabricColor || "—"}</p></div>
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-muted-foreground">Ölçü / Adet</p><div className="mt-1 space-y-1 font-semibold">{normalizeOrderMeasurements(order).map((item, index) => <p key={`${item.label}-${index}`}>{formatMeasurementLine(item)}</p>)}</div></div>
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-muted-foreground">Montaj / Kasa</p><p className="mt-1 font-semibold">{order.mountType || "—"} / {formatCaseType(order.caseType)}</p></div>
          <div className="rounded-xl bg-muted/50 p-4"><p className="text-muted-foreground">Sipariş Tarihi</p><p className="mt-1 font-semibold">{order.createdAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(order.createdAt)) : "—"}</p></div>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Gizliliğiniz için bu ekranda müşteri adresi ve telefon bilgileri gösterilmez.</p>
      </CardContent>
    </Card>}
  </div>;
}
