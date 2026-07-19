import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Package, LogIn, Clock, Edit2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ORDER_STATUS_LABELS } from "@shared/types";
import type { OrderStatus } from "@shared/types";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  production: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipping: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function ProfileForm() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ad Soyad</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Telefon</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" placeholder="05XX XXX XXXX" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Şehir</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <Label>Adres</Label>
        <Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="rounded-xl" rows={2} />
      </div>
      <Button
        onClick={() => updateMutation.mutate({ name, phone, city, address })}
        disabled={updateMutation.isPending}
        className="gap-2 btn-premium"
      >
        <Save className="h-4 w-4" />
        {saved ? "Kaydedildi!" : updateMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </div>
  );
}

export default function CustomerPanel() {
  const { user, isAuthenticated } = useAuth();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-16 max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-3">Giriş Yapın</h2>
        <p className="text-muted-foreground mb-6">
          Hesabınızı görüntülemek için giriş yapın
        </p>
        <Button onClick={() => startLogin()} className="btn-premium gap-2">
          <LogIn className="h-4 w-4" />
          Giriş Yap
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Hesabım</h1>
      </div>

      {/* Profile Card */}
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

      {/* Profile Edit */}
      <Card className="border-border/50 mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      {/* Orders */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Siparişlerim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="p-4 rounded-xl border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">#{order.orderNumber}</span>
                        <Badge className={`text-xs ${statusColors[order.status as OrderStatus] || ""}`}>
                          {ORDER_STATUS_LABELS[order.status as OrderStatus] || order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.fabricName} - {order.fabricColor}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">{order.totalPrice} ₺</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Henüz siparişiniz bulunmuyor</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
