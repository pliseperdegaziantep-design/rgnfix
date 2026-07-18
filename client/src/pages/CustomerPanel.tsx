import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Package, LogIn, Clock, Edit2, Save, XCircle, ShoppingCart, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ORDER_STATUS_LABELS } from "@shared/types";
import type { OrderStatus } from "@shared/types";
import { toast } from "sonner";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  production: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipping: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const progressStatuses: OrderStatus[] = ["pending", "confirmed", "production", "preparing", "shipping", "delivered"];

function formatMoney(value: string | number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function ProfileForm() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setCity(user?.city || "");
    setAddress(user?.address || "");
  }, [user]);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: async () => {
      setSaved(true);
      await refresh();
      setTimeout(() => setSaved(false), 2000);
    },
    onError: error => toast.error(error.message || "Profil kaydedilemedi."),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ad Soyad</Label>
          <Input value={name} onChange={event => setName(event.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Telefon</Label>
          <Input value={phone} onChange={event => setPhone(event.target.value)} className="rounded-xl" placeholder="05XX XXX XXXX" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Şehir</Label>
        <Input value={city} onChange={event => setCity(event.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Adres</Label>
        <Textarea value={address} onChange={event => setAddress(event.target.value)} className="rounded-xl" rows={2} />
      </div>
      <Button
        onClick={() => updateMutation.mutate({ name, phone, city, address })}
        disabled={updateMutation.isPending}
        className="gap-2 btn-premium"
      >
        <Save className="h-4 w-4" />
        {saved ? "Kaydedildi!" : updateMutation.isPending ? "Kaydediliyor..." : "Bilgileri Kaydet"}
      </Button>
    </div>
  );
}

export default function CustomerPanel() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "user",
  });

  const cancelMutation = trpc.orders.cancel.useMutation({
    onSuccess: async () => {
      toast.success("Siparişiniz iptal edildi.");
      await utils.orders.myOrders.invalidate();
    },
    onError: error => toast.error(error.message || "Sipariş iptal edilemedi."),
  });

  const now = Date.now();
  const sortedOrders = useMemo(
    () => [...(orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  if (authLoading) {
    return <div className="container py-16 text-center text-muted-foreground">Hesabınız yükleniyor…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-16 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-3">Giriş Yapın veya Kayıt Olun</h2>
        <p className="text-muted-foreground mb-6">
          Siparişlerinizi takip etmek ve 24 saat içinde iptal edebilmek için hesabınıza giriş yapın.
        </p>
        <Button onClick={() => startLogin()} className="btn-premium gap-2">
          <LogIn className="h-4 w-4" />
          Giriş Yap / Kayıt Ol
        </Button>
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="container max-w-lg py-16 text-center">
        <Card className="p-8">
          <LayoutDashboard className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Yönetici hesabı</h2>
          <p className="mt-2 text-muted-foreground">Siparişleri yönetim panelinden görüntüleyebilirsiniz.</p>
          <Link href="/yonetici"><Button className="mt-6">Yönetim Paneline Git</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">RGNFIX Müşteri Hesabı</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold">Hesabım</h1>
          <p className="mt-2 text-muted-foreground">Siparişlerinizi ve teslimat sürecini buradan takip edebilirsiniz.</p>
        </div>
        <Link href="/siparis"><Button className="gap-2"><ShoppingCart className="h-4 w-4" /> Yeni Sipariş</Button></Link>
      </div>

      <Card className="border-border/50 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user?.name || "Kullanıcı"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit2 className="h-5 w-5" /> Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent><ProfileForm /></CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" /> Siparişlerim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(index => <div key={index} className="h-28 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : sortedOrders.length > 0 ? (
            <div className="space-y-5">
              {sortedOrders.map(order => {
                const createdAt = new Date(order.createdAt).getTime();
                const deadline = createdAt + 24 * 60 * 60 * 1000;
                const remainingMs = deadline - now;
                const canCancel = remainingMs > 0 && order.status !== "cancelled" && order.status !== "delivered";
                const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
                const currentIndex = progressStatuses.indexOf(order.status as OrderStatus);

                return (
                  <div key={order.id} className="rounded-2xl border border-border/60 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-lg font-bold">Sipariş #{order.orderNumber}</span>
                          <Badge className={`text-xs ${statusColors[order.status as OrderStatus] || ""}`}>
                            {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{order.fabricName} · {order.fabricColor}</p>
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleString("tr-TR")}
                        </p>
                      </div>
                      <span className="text-lg font-semibold text-primary">{formatMoney(order.totalPrice)}</span>
                    </div>

                    {order.status !== "cancelled" && (
                      <div className="mt-5 grid grid-cols-6 gap-1">
                        {progressStatuses.map((status, index) => {
                          const active = currentIndex >= index;
                          return (
                            <div key={status} className="text-center">
                              <div className={`mx-auto h-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />
                              <span className={`mt-2 hidden text-[10px] sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                                {ORDER_STATUS_LABELS[status]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-muted-foreground">
                        {canCancel
                          ? `İptal hakkınız için yaklaşık ${remainingHours} saat kaldı.`
                          : order.status === "cancelled"
                            ? "Sipariş iptal edildi."
                            : "24 saatlik ücretsiz iptal süresi sona erdi."}
                      </div>
                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            if (window.confirm(`#${order.orderNumber} numaralı siparişi iptal etmek istediğinize emin misiniz?`)) {
                              cancelMutation.mutate({ id: order.id });
                            }
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                          Siparişi İptal Et
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Henüz hesabınıza bağlı sipariş bulunmuyor.</p>
              <Link href="/siparis"><Button variant="outline" className="mt-4">Sipariş Oluştur</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
