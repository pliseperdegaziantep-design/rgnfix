import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, Save, ShoppingCart } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatMeasurementLine, normalizeOrderMeasurements } from "@shared/orderMeasurements";

const statuses = [
  ["pending", "Onay Bekliyor"], ["confirmed", "Onaylandı"], ["production", "Üretimde"],
  ["preparing", "Hazırlanıyor"], ["shipping", "Kargoda"], ["delivered", "Teslim Edildi"], ["cancelled", "İptal Edildi"],
] as const;

const mountOptions = [
  ["vidali", "Vidalı"], ["kancali", "Kancalı"], ["yapisma", "Yapıştırma"], ["rgn-pen", "RGN PEN"],
] as const;

const profileOptions = ["Beyaz", "Krem", "Gümüş Gri", "Antrasit", "Kahve", "Bronz"];

export default function AdminOrderEdit() {
  useAuth({ redirectOnUnauthenticated: true, redirectPath: "/giris" });
  const [, params] = useRoute("/yonetici/siparis/:id/duzenle");
  const id = Number(params?.id || 0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/orders/${id}`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.order) throw new Error(data.error || "Sipariş bulunamadı.");
        const order = data.order;
        setForm(Object.fromEntries(Object.entries(order).map(([key, value]) => [key, value == null ? "" : String(value)])));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sipariş yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const change = (field: string, value: string) => setForm(current => ({ ...current, [field]: value }));
  const title = useMemo(() => form.orderNumber ? `#${form.orderNumber} Siparişini Düzenle` : "Siparişi Düzenle", [form.orderNumber]);
  const orderMeasurements = useMemo(() => normalizeOrderMeasurements(form), [form]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fabricName: form.fabricName,
          fabricColor: form.fabricColor,
          profileColor: form.profileColor,
          mountType: form.mountType,
          caseType: form.caseType,
          width: Number(form.width),
          height: Number(form.height),
          quantity: Number(form.quantity),
          totalPrice: Number(form.totalPrice),
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
          customerCity: form.customerCity,
          customerNote: form.customerNote,
          status: form.status,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Sipariş kaydedilemedi.");
      toast.success("Siparişin bütün değişiklikleri tek seferde kaydedildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sipariş kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Sipariş yükleniyor…</div>;

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">RGNFIX Yönetim</p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Müşteri, ürün, ölçü, fiyat, teslimat ve durum bilgilerini aynı ekrandan düzenleyin.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/yonetici"><ArrowLeft className="mr-2 h-4 w-4" />Panele Dön</Link></Button>
          <Button onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Kaydediliyor…" : "Tüm Değişiklikleri Kaydet"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Müşteri ve Teslimat</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad Soyad" value={form.customerName} onChange={value => change("customerName", value)} />
          <Field label="Telefon" value={form.customerPhone} onChange={value => change("customerPhone", value)} />
          <Field label="Şehir" value={form.customerCity} onChange={value => change("customerCity", value)} />
          <div className="sm:col-span-2"><Label>Adres</Label><Textarea className="mt-2 min-h-24" value={form.customerAddress || ""} onChange={event => change("customerAddress", event.target.value)} /></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Sipariş Durumu ve Tutar</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label>Durum</Label><Select value={form.status || "pending"} onValueChange={value => change("status", value)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{statuses.map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <Field label="Toplam Tutar (TL)" type="number" value={form.totalPrice} onChange={value => change("totalPrice", value)} />
          <Field label="Sipariş Numarası" value={form.orderNumber} onChange={() => {}} disabled />
          <Field label="Kayıt ID" value={String(id)} onChange={() => {}} disabled />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Ürün Bilgileri</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Kumaş Serisi" value={form.fabricName} onChange={value => change("fabricName", value)} />
          <Field label="Kumaş Varyantı" value={form.fabricColor} onChange={value => change("fabricColor", value)} />
          <div><Label>Profil Rengi</Label><Select value={form.profileColor || ""} onValueChange={value => change("profileColor", value)}><SelectTrigger className="mt-2"><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{profileOptions.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Montaj Tipi</Label><Select value={form.mountType || ""} onValueChange={value => change("mountType", value)}><SelectTrigger className="mt-2"><SelectValue placeholder="Seçin" /></SelectTrigger><SelectContent>{mountOptions.map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Kasa Tipi</Label><Select value={form.caseType || "kalin"} onValueChange={value => change("caseType", value)}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="kalin">Standart Kasa / Tek Cam</SelectItem><SelectItem value="slim">Slim Kasa / Çift Cam</SelectItem></SelectContent></Select></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Ölçü ve Adet</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="En (cm)" type="number" value={form.width} onChange={value => change("width", value)} />
          <Field label="Boy (cm)" type="number" value={form.height} onChange={value => change("height", value)} />
          <Field label="Adet" type="number" value={form.quantity} onChange={value => change("quantity", value)} />
          <div className="sm:col-span-3 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground"><ShoppingCart className="mb-2 h-5 w-5 text-primary" />Ölçüleri çelik metreyle santimetre olarak girin. Ondalıklı ölçüleri yuvarlamadan kaydedin.</div>
          <div className="sm:col-span-3 rounded-xl border bg-muted/30 p-4 text-sm"><p className="font-semibold text-foreground">Kayıtlı tüm ölçüler</p><div className="mt-2 space-y-1 text-muted-foreground">{orderMeasurements.map((item, index) => <p key={`${item.label}-${index}`}>{formatMeasurementLine(item)}</p>)}</div></div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Sipariş Notu ve Tüm Ölçü Detayları</CardTitle></CardHeader><CardContent><Textarea className="min-h-44" value={form.customerNote || ""} onChange={event => change("customerNote", event.target.value)} /></CardContent></Card>

      <div className="flex justify-end"><Button size="lg" onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" />Tüm Değişiklikleri Kaydet</Button></div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value?: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <div><Label>{label}</Label><Input className="mt-2" type={type} step={type === "number" ? "0.01" : undefined} value={value || ""} disabled={disabled} onChange={event => onChange(event.target.value)} /></div>;
}
