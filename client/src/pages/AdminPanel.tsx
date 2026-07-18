import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Bell,
  BellRing,
  ClipboardList,
  PackageCheck,
  Printer,
  RefreshCw,
  Truck,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

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
const LAST_ORDER_KEY = "rgnfix-admin-last-order-id";

function money(value: string | number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function date(value: string | Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function printOrderA5(order: Order) {
  const popup = window.open("", "_blank", "width=620,height=900");
  if (!popup) {
    toast.error("Yazdırma penceresi engellendi. Tarayıcı açılır pencere izni verin.");
    return;
  }

  const note = escapeHtml(order.customerNote).replaceAll("\n", "<br>");
  popup.document.write(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Sipariş ${escapeHtml(order.orderNumber)}</title>
<style>
  @page { size: A5 portrait; margin: 9mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #102b2b; font-size: 11px; }
  .sheet { width: 100%; min-height: 190mm; border: 1.5px solid #143b3b; padding: 9mm; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #143b3b; padding-bottom: 7mm; }
  .brand { font-size: 25px; font-weight: 900; letter-spacing: -1px; }
  .brand span { color: #28a8a8; }
  .subtitle { font-size: 8px; letter-spacing: 1.2px; margin-top: 2px; }
  .order-no { text-align: right; }
  .order-no strong { display: block; font-size: 23px; }
  .section { margin-top: 7mm; }
  .section h2 { margin: 0 0 3mm; font-size: 12px; padding-bottom: 2mm; border-bottom: 1px solid #cad6d6; text-transform: uppercase; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 7mm; }
  .row { display: flex; gap: 3mm; padding: 1.5mm 0; border-bottom: 1px dotted #d8e1e1; }
  .label { width: 34mm; color: #5e7171; flex: 0 0 auto; }
  .value { font-weight: 700; white-space: pre-wrap; }
  .total { margin-top: 7mm; display: flex; justify-content: space-between; align-items: center; padding: 5mm; background: #eef7f7; border: 1px solid #c4dede; font-size: 15px; }
  .note { padding: 4mm; background: #f7f8f8; border-radius: 3mm; line-height: 1.45; }
  .footer { margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #cad6d6; display: flex; justify-content: space-between; color: #657575; font-size: 8px; }
  @media print { .sheet { border: none; } }
</style>
</head>
<body onload="window.print(); window.onafterprint = () => window.close();">
  <div class="sheet">
    <div class="header">
      <div><div class="brand">RGN<span>FIX</span></div><div class="subtitle">AKILLI ÖLÇÜ VE DEMONTE ÜRÜN PLATFORMU</div></div>
      <div class="order-no"><span>SİPARİŞ NO</span><strong>${escapeHtml(order.orderNumber)}</strong><small>${escapeHtml(date(order.createdAt))}</small></div>
    </div>

    <div class="section">
      <h2>Müşteri Bilgileri</h2>
      <div class="row"><div class="label">Ad Soyad</div><div class="value">${escapeHtml(order.customerName || "—")}</div></div>
      <div class="row"><div class="label">Telefon</div><div class="value">${escapeHtml(order.customerPhone || "—")}</div></div>
      <div class="row"><div class="label">Şehir / Adres</div><div class="value">${escapeHtml(order.customerCity || "")} ${escapeHtml(order.customerAddress || "")}</div></div>
    </div>

    <div class="section">
      <h2>Ürün Bilgileri</h2>
      <div class="grid">
        <div class="row"><div class="label">Kumaş</div><div class="value">${escapeHtml(order.fabricName || "—")}</div></div>
        <div class="row"><div class="label">Kumaş Rengi</div><div class="value">${escapeHtml(order.fabricColor || "—")}</div></div>
        <div class="row"><div class="label">Profil Rengi</div><div class="value">${escapeHtml(order.profileColor || "—")}</div></div>
        <div class="row"><div class="label">Montaj / Kasa</div><div class="value">${escapeHtml(order.mountType || "—")} / ${escapeHtml(order.caseType || "—")}</div></div>
        <div class="row"><div class="label">Ana Ölçü</div><div class="value">${escapeHtml(order.width || "—")} × ${escapeHtml(order.height || "—")} cm</div></div>
        <div class="row"><div class="label">Toplam Adet</div><div class="value">${escapeHtml(order.quantity || 1)}</div></div>
        <div class="row"><div class="label">Durum</div><div class="value">${escapeHtml(statusLabels[order.status])}</div></div>
      </div>
    </div>

    <div class="section"><h2>Sipariş Notu / Ölçü Detayları</h2><div class="note">${note || "Not bulunmuyor."}</div></div>
    <div class="total"><span>TOPLAM SİPARİŞ TUTARI</span><strong>${escapeHtml(money(order.totalPrice))}</strong></div>
    <div class="footer"><span>RGNFIX · rgnfix.com</span><span>+90 530 028 89 03</span></div>
  </div>
</body>
</html>`);
  popup.document.close();
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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification === "undefined" ? "denied" : Notification.permission
  );
  const firstLoadRef = useRef(true);

  const notifyNewOrders = useCallback((newOrders: Order[]) => {
    if (newOrders.length === 0) return;
    const newest = newOrders[0];
    toast.success(`${newOrders.length} yeni sipariş geldi: #${newest.orderNumber}`);

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const notification = new Notification("RGNFIX Yeni Sipariş", {
        body: `#${newest.orderNumber} · ${newest.customerName || "Müşteri"} · ${money(newest.totalPrice)}`,
        icon: "/favicon.ico",
        tag: `rgnfix-order-${newest.id}`,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }, []);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders", { credentials: "include" });
      const data = (await response.json().catch(() => ({}))) as {
        orders?: Order[];
        demoMode?: boolean;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || "Siparişler yüklenemedi.");

      const nextOrders = data.orders ?? [];
      const maxId = nextOrders.reduce((max, order) => Math.max(max, Number(order.id)), 0);
      const storedLastId = Number(localStorage.getItem(LAST_ORDER_KEY) || "0");

      if (!firstLoadRef.current || storedLastId > 0) {
        const baseline = Math.max(storedLastId, orders.reduce((max, order) => Math.max(max, Number(order.id)), 0));
        notifyNewOrders(nextOrders.filter(order => Number(order.id) > baseline));
      }

      if (maxId > 0) localStorage.setItem(LAST_ORDER_KEY, String(maxId));
      firstLoadRef.current = false;
      setOrders(nextOrders);
      setDemoMode(Boolean(data.demoMode));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Siparişler yüklenemedi.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [notifyNewOrders, orders]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    void loadOrders();
    const timer = window.setInterval(() => void loadOrders(true), 12_000);
    return () => window.clearInterval(timer);
  }, [user?.role, loadOrders]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Bu tarayıcı bildirimleri desteklemiyor.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") toast.success("Yeni sipariş bildirimleri açıldı.");
    else toast.error("Bildirim izni verilmedi.");
  };

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
      toast.success("Sipariş durumu güncellendi.");
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
          <Link href="/giris"><Button className="mt-6">Giriş Sayfasına Git</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">RGNFIX Yönetim</p>
          <h1 className="text-3xl font-serif font-bold">Sipariş Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hoş geldiniz, {user.name || "Yönetici"}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={notificationPermission === "granted" ? "secondary" : "outline"}
            onClick={() => void enableNotifications()}
            className="gap-2"
          >
            {notificationPermission === "granted" ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {notificationPermission === "granted" ? "Bildirimler Açık" : "Bildirimleri Aç"}
          </Button>
          <Button variant="outline" onClick={() => void loadOrders()} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Yenile
          </Button>
        </div>
      </div>

      {demoMode && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Veritabanı bağlı değil. Siparişler geçici hafızada tutulur ve sunucu yeniden başlarsa silinebilir.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><ClipboardList className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{totals.total}</p><p className="text-sm text-muted-foreground">Toplam sipariş</p></Card>
        <Card className="p-5"><PackageCheck className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{totals.production}</p><p className="text-sm text-muted-foreground">Hazırlanan sipariş</p></Card>
        <Card className="p-5"><Truck className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{totals.shipping}</p><p className="text-sm text-muted-foreground">Kargodaki sipariş</p></Card>
        <Card className="p-5"><WalletCards className="h-5 w-5 text-primary" /><p className="mt-4 text-2xl font-bold">{money(totals.revenue)}</p><p className="text-sm text-muted-foreground">Toplam sipariş tutarı</p></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4"><h2 className="font-semibold">Siparişler</h2></div>

        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Siparişler yükleniyor…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">Henüz sipariş bulunmuyor.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Sipariş</th>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Ürün</th>
                  <th className="px-4 py-3 font-medium">Ölçü</th>
                  <th className="px-4 py-3 font-medium">Tutar</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">Çıktı</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map(order => (
                  <tr key={order.id} className="align-top hover:bg-muted/30">
                    <td className="px-4 py-4"><p className="font-semibold text-base">#{order.orderNumber}</p><p className="text-xs text-muted-foreground">Kayıt {order.id}</p></td>
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
                      {order.customerNote && <p className="mt-2 max-w-56 whitespace-pre-line text-xs text-muted-foreground line-clamp-4">{order.customerNote}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <Button variant="outline" size="sm" onClick={() => printOrderA5(order)} className="gap-2 whitespace-nowrap">
                        <Printer className="h-4 w-4" /> A5 Yazdır
                      </Button>
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
