import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { ClipboardList, PackageCheck, RefreshCw, Truck, WalletCards } from "lucide-react";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "production"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled";

type Order = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  fabricName?: string | null;
  fabricColor?: string | null;
  profileColor?: string | null;
  mountType?: string | null;
  caseType?: string | null;
  width?: string | number | null;
  height?: string | number | null;
  quantity?: number | null;
  totalPrice: string | number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  customerCity?: string | null;
  customerNote?: string | null;
  createdAt: string | Date;
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  production: "İmalatta",
  preparing: "Hazırlanıyor",
  shipping: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const statusOptions = Object.entries(statusLabels) as Array<[OrderStatus, string]>;

function money(value: string | number) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(number);
}

function date(value: string | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/giris",
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { credentials: "include" });
      const data = (await response.json().catch(() => ({}))) as {
        orders?: Order[];
        demoMode?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Siparişler yüklenemedi.");
      setOrders(data.orders ?? []);
      setDemoMode(Boolean(data.demoMode));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Siparişler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") void loadOrders();
  }, [user?.role]);

  const updateStatus = async (id: number, status: OrderStatus) => {
    setUpdatingId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Sipariş durumu güncellenemedi.");
      setOrders(current => current.map(order => (order.id === id ? { ...order, status } : order)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sipariş durumu güncellenemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const totals = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    return {
      total: orders.length,
      production: orders.filter(order => ["confirmed", "production", "preparing"].includes(order.status)).length,
      shipping: orders.filter(order => order.status === "shipping").length,
      revenue: totalRevenue,
    };
  }, [orders]);

  if (authLoading) {
    return <div className="container py-16 text-center text-muted-foreground">Giriş kontrol ediliyor…</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="container max-w-lg py-16 text-center">
        <Card className="p-8">
          <h1 className="text-2xl font-bold">Yetkisiz erişim</h1>
          <p className="mt-3 text-muted-foreground">Bu sayfa yalnızca yönetici hesabına açıktır.</p>
          <Link href="/giris"><Button className="mt-6">Yönetici Girişi</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">RGNFIX Yönetim</p>
          <h1 className="text-3xl font-serif font-bold">Sipariş Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hoş geldiniz, {user.name || "Yönetici"}.</p>
        </div>
        <Button variant="outline" onClick={() => void loadOrders()} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </Button>
      </div>

      {demoMode && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Veritabanı bağlı değil. Siparişler geçici hafızada tutulur ve sunucu yeniden başlarsa silinebilir. Kalıcı kullanım için Hostinger MySQL bağlantısı eklenmelidir.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><ClipboardList className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{totals.total}</p><p className="text-sm text-muted-foreground">Toplam sipariş</p></Card>
        <Card className="p-5"><PackageCheck className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{totals.production}</p><p className="text-sm text-muted-foreground">Hazırlanan sipariş</p></Card>
        <Card className="p-5"><Truck className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{totals.shipping}</p><p className="text-sm text-muted-foreground">Kargodaki sipariş</p></Card>
        <Card className="p-5"><WalletCards className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{money(totals.revenue)}</p><p className="text-sm text-muted-foreground">Toplam sipariş tutarı</p></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Siparişler</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Siparişler yükleniyor…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Henüz sipariş bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Sipariş</th>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Ürün</th>
                  <th className="px-4 py-3 font-medium">Ölçü</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(order => (
                  <tr key={order.id} className="align-top hover:bg-muted/30">
                    <td className="px-4 py-4"><p className="font-semibold">{order.orderNumber}</p><p className="text-xs text-muted-foreground">#{order.id}</p></td>
                    <td className="px-4 py-4"><p className="font-medium">{order.customerName || "—"}</p><p>{order.customerPhone || "—"}</p><p className="max-w-60 text-xs text-muted-foreground">{order.customerCity} {order.customerAddress}</p></td>
                    <td className="px-4 py-4"><p className="font-medium">{order.fabricName || "—"}</p><p className="text-xs text-muted-foreground">{order.fabricColor} / {order.profileColor}</p><p className="text-xs text-muted-foreground">{order.mountType} / {order.caseType}</p></td>
                    <td className="px-4 py-4">{order.width} × {order.height} cm<p className="text-xs text-muted-foreground">{order.quantity || 1} adet</p></td>
                    <td className="px-4 py-4 font-semibold">{money(order.totalPrice)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{date(order.createdAt)}</td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={event => void updateStatus(order.id, event.target.value as OrderStatus)}
                        disabled={updatingId === order.id}
                        className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                      >
                        {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      {order.customerNote && <p className="mt-2 max-w-52 text-xs text-muted-foreground">Not: {order.customerNote}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
