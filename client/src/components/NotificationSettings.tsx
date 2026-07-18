import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isNativeApp, registerNativePush } from "@/lib/mobilePush";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [busy, setBusy] = useState(false);
  const [registeredDevices, setRegisteredDevices] = useState(0);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/push/status", { credentials: "include" })
      .then(response => response.json())
      .then((data: { registeredDevices?: number; configured?: boolean }) => {
        if (!active) return;
        setRegisteredDevices(data.registeredDevices ?? 0);
        setConfigured(Boolean(data.configured));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const result = await registerNativePush();
      if (result.registered) setRegisteredDevices(current => Math.max(1, current));
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bildirimler açılamadı.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5" />Sipariş Bildirimleri</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Siparişiniz onaylandığında, üretime geçtiğinde, kargoya verildiğinde ve teslim edildiğinde bildirim alın.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" className="gap-2" onClick={enable} disabled={busy}>
            <Bell className="h-4 w-4" />
            {busy ? "İzin isteniyor…" : registeredDevices > 0 ? "Bu Cihazda Bildirimleri Yenile" : "Bildirimleri Aç"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {isNativeApp()
              ? registeredDevices > 0
                ? `${registeredDevices} cihaz kayıtlı.`
                : configured
                  ? "Henüz kayıtlı cihaz yok."
                  : "Sunucu bildirim ayarları tamamlanınca aktif olur."
              : "Web tarayıcısında yalnızca açık oturum bildirimleri kullanılabilir."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
