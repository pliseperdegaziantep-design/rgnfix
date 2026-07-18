import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Download, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

async function readError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  return data.error || fallback;
}

export default function AccountSettings() {
  const { user, loading, isAuthenticated } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/giris",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Hesap ayarları yükleniyor…</div>;
  if (!isAuthenticated || !user) return null;

  if (user.role === "admin") {
    return (
      <div className="container max-w-xl py-16 text-center">
        <Card><CardContent className="p-8"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-bold">Yönetici hesabı</h1><p className="mt-2 text-muted-foreground">Bu ayarlar müşteri hesapları içindir.</p><Link href="/yonetici"><Button className="mt-6">Yönetim Paneline Dön</Button></Link></CardContent></Card>
      </div>
    );
  }

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== newPasswordAgain) {
      toast.error("Yeni şifreler eşleşmiyor.");
      return;
    }
    setPasswordBusy(true);
    try {
      const response = await fetch("/api/local-auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) throw new Error(await readError(response, "Şifre değiştirilemedi."));
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      toast.success("Şifreniz değiştirildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Şifre değiştirilemedi.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const exportData = async () => {
    setExportBusy(true);
    try {
      const response = await fetch("/api/local-auth/export", { credentials: "include" });
      if (!response.ok) throw new Error(await readError(response, "Veriler hazırlanamadı."));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `RGNFIX-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Hesap verileriniz indirildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Veriler indirilemedi.");
    } finally {
      setExportBusy(false);
    }
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!deleteConfirm) {
      toast.error("Hesap silme onay kutusunu işaretleyin.");
      return;
    }
    if (!window.confirm("RGNFIX hesabınızın kalıcı olarak silinmesini onaylıyor musunuz?")) return;

    setDeleteBusy(true);
    try {
      const response = await fetch("/api/local-auth/account", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!response.ok) throw new Error(await readError(response, "Hesap silinemedi."));
      window.location.href = "/?hesap-silindi=1";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hesap silinemedi.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 sm:py-12">
      <Link href="/hesabim"><Button variant="ghost" className="mb-5 gap-2"><ArrowLeft className="h-4 w-4" />Hesabıma Dön</Button></Link>
      <div className="mb-8"><p className="text-sm font-semibold text-primary">RGNFIX Müşteri Hesabı</p><h1 className="mt-2 text-3xl font-serif font-bold">Hesap Ayarları</h1><p className="mt-2 text-muted-foreground">Güvenlik, veri indirme ve hesap silme işlemlerini buradan yönetin.</p></div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Şifre Değiştir</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2"><Label>Mevcut Şifre</Label><Input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Yeni Şifre</Label><Input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={event => setNewPassword(event.target.value)} required /></div>
                <div className="space-y-2"><Label>Yeni Şifre Tekrar</Label><Input type="password" autoComplete="new-password" minLength={8} value={newPasswordAgain} onChange={event => setNewPasswordAgain(event.target.value)} required /></div>
              </div>
              <Button type="submit" disabled={passwordBusy}>{passwordBusy ? "Değiştiriliyor…" : "Şifreyi Değiştir"}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" />Verilerimi İndir</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-6 text-muted-foreground">Hesap, sipariş ve kayıtlı ölçü bilgilerinizi JSON dosyası olarak indirebilirsiniz.</p><Button variant="outline" className="mt-4 gap-2" onClick={exportData} disabled={exportBusy}><Download className="h-4 w-4" />{exportBusy ? "Hazırlanıyor…" : "Verilerimi İndir"}</Button></CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Hesabımı Sil</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-5 flex gap-3 rounded-xl bg-destructive/10 p-4 text-sm leading-6"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /><p>Bu işlem kalıcıdır. Devam eden siparişiniz varsa hesap silme işlemi tamamlanmaz. Tamamlanmış siparişler kişisel bilgilerden arındırılabilir.</p></div>
            <form onSubmit={deleteAccount} className="space-y-4">
              <div className="space-y-2"><Label>Şifreniz</Label><Input type="password" autoComplete="current-password" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} required /></div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={deleteConfirm} onChange={event => setDeleteConfirm(event.target.checked)} /><span>Hesabımın ve hesabıma bağlı profil/ölçü bilgilerinin kalıcı olarak silineceğini anlıyorum.</span></label>
              <Button type="submit" variant="destructive" disabled={deleteBusy || !deleteConfirm}>{deleteBusy ? "Hesap siliniyor…" : "Hesabımı Kalıcı Olarak Sil"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
