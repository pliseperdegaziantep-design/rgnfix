import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Save, ArrowLeft, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PriceSetting = {
  seriesId: string;
  seriesName: string;
  basePrice: string | number;
  adhesiveSurcharge: string | number;
};

export default function AdminPrices() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/giris" });
  const [prices, setPrices] = useState<PriceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    void (async () => {
      try {
        const response = await fetch("/api/prices", { cache: "no-store" });
        const data = await response.json() as { prices?: PriceSetting[]; error?: string };
        if (!response.ok) throw new Error(data.error || "Fiyatlar yüklenemedi.");
        setPrices(data.prices || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fiyatlar yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.role]);

  const updateLocal = (seriesId: string, field: "basePrice" | "adhesiveSurcharge", value: string) => {
    setPrices(current => current.map(item => item.seriesId === seriesId ? { ...item, [field]: value } : item));
  };

  const save = async (item: PriceSetting) => {
    setSaving(item.seriesId);
    setError("");
    try {
      const response = await fetch(`/api/admin/prices/${item.seriesId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ basePrice: Number(item.basePrice), adhesiveSurcharge: Number(item.adhesiveSurcharge) }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Fiyat kaydedilemedi.");
      toast.success(`${item.seriesName} fiyatı güncellendi.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fiyat kaydedilemedi.");
    } finally {
      setSaving("");
    }
  };

  if (authLoading || loading) return <div className="container py-16 text-center text-muted-foreground">Fiyat yönetimi yükleniyor…</div>;
  if (!user || user.role !== "admin") return <div className="container max-w-lg py-16 text-center"><Card className="p-8"><h1 className="text-2xl font-bold">Yetkisiz erişim</h1><Link href="/giris"><Button className="mt-6">Giriş Yap</Button></Link></Card></div>;

  return <div className="container max-w-4xl py-8 space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium text-primary">RGNFIX Yönetim</p><h1 className="text-3xl font-serif font-bold">Manuel Fiyat Yönetimi</h1><p className="mt-1 text-sm text-muted-foreground">Kod değiştirmeden kumaş ve yapıştırma farklarını güncelleyin.</p></div>
      <Button variant="outline" asChild className="gap-2"><Link href="/yonetici"><ArrowLeft className="h-4 w-4" /> Sipariş Paneli</Link></Button>
    </div>
    {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-primary" /> Kumaş m² Fiyatları</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {prices.map(item => <div key={item.seriesId} className="grid gap-4 rounded-xl border p-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
          <div><p className="font-semibold">{item.seriesName}</p><p className="text-xs text-muted-foreground">Vidalı ve kancalı temel m² fiyatı</p></div>
          <div className="space-y-2"><Label>Temel fiyat (TL/m²)</Label><Input type="number" min="1" step="1" value={String(item.basePrice)} onChange={event => updateLocal(item.seriesId, "basePrice", event.target.value)} /></div>
          <div className="space-y-2"><Label>Yapıştırma farkı</Label><Input type="number" min="0" step="1" value={String(item.adhesiveSurcharge)} onChange={event => updateLocal(item.seriesId, "adhesiveSurcharge", event.target.value)} /></div>
          <Button onClick={() => void save(item)} disabled={saving === item.seriesId} className="gap-2"><Save className="h-4 w-4" /> {saving === item.seriesId ? "Kaydediliyor" : "Kaydet"}</Button>
        </div>)}
      </CardContent>
    </Card>
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Nova başlangıç fiyatı vidalı ve kancalı için 485 TL/m², yapıştırma için 550 TL/m² olarak tanımlandı. Fark 65 TL’dir.</div>
  </div>;
}
