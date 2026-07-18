import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, KeyRound, Loader2, Mail, XCircle } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

async function readJson(response: Response) {
  return (await response.json().catch(() => ({}))) as { success?: boolean; message?: string; error?: string };
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="container max-w-md py-10 sm:py-16">
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6 flex justify-center"><BrandLogo className="h-14" /></div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/local-auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Şifre yenileme bağlantısı gönderilemedi.");
      setMessage(data.message || "E-posta adresiniz kayıtlıysa şifre yenileme bağlantısı gönderildi.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      <div className="text-center"><Mail className="mx-auto h-9 w-9 text-primary" /><h1 className="mt-4 text-2xl font-serif font-bold">Şifremi Unuttum</h1><p className="mt-2 text-sm text-muted-foreground">Kayıtlı e-posta adresinize güvenli şifre yenileme bağlantısı gönderilir.</p></div>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div className="space-y-2"><Label htmlFor="forgot-email">E-posta</Label><Input id="forgot-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>
        {message && <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</div>}
        {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <Button className="w-full" disabled={busy}>{busy ? "Gönderiliyor…" : "Yenileme Bağlantısı Gönder"}</Button>
      </form>
      <Link href="/giris"><Button variant="ghost" className="mt-4 w-full">Giriş Ekranına Dön</Button></Link>
    </AuthCard>
  );
}

export function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== again) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/local-auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await readJson(response);
      if (!response.ok) throw new Error(data.error || "Şifre yenilenemedi.");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Şifre yenilenemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      {success ? (
        <div className="text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-4 text-2xl font-serif font-bold">Şifreniz Yenilendi</h1><p className="mt-2 text-sm text-muted-foreground">Yeni şifrenizle hesabınıza giriş yapabilirsiniz.</p><Link href="/giris"><Button className="mt-6 w-full">Giriş Yap</Button></Link></div>
      ) : (
        <>
          <div className="text-center"><KeyRound className="mx-auto h-9 w-9 text-primary" /><h1 className="mt-4 text-2xl font-serif font-bold">Yeni Şifre Belirle</h1><p className="mt-2 text-sm text-muted-foreground">Yeni şifreniz en az 8 karakter olmalıdır.</p></div>
          {!token ? <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Şifre yenileme bağlantısı eksik veya geçersiz.</div> : (
            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="space-y-2"><Label>Yeni Şifre</Label><Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required /></div>
              <div className="space-y-2"><Label>Yeni Şifre Tekrar</Label><Input type="password" autoComplete="new-password" minLength={8} value={again} onChange={event => setAgain(event.target.value)} required /></div>
              {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <Button className="w-full" disabled={busy}>{busy ? "Kaydediliyor…" : "Şifremi Yenile"}</Button>
            </form>
          )}
        </>
      )}
    </AuthCard>
  );
}

export function VerifyEmail() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const verify = async () => {
      if (!token) {
        setState("error");
        setMessage("Doğrulama bağlantısı eksik veya geçersiz.");
        return;
      }
      try {
        const response = await fetch(`/api/local-auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await readJson(response);
        if (!response.ok) throw new Error(data.error || "E-posta doğrulanamadı.");
        if (active) setState("success");
      } catch (err) {
        if (active) {
          setState("error");
          setMessage(err instanceof Error ? err.message : "E-posta doğrulanamadı.");
        }
      }
    };
    void verify();
    return () => { active = false; };
  }, [token]);

  return (
    <AuthCard>
      <div className="text-center">
        {state === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />}
        {state === "success" && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />}
        {state === "error" && <XCircle className="mx-auto h-12 w-12 text-destructive" />}
        <h1 className="mt-4 text-2xl font-serif font-bold">{state === "loading" ? "E-posta Doğrulanıyor" : state === "success" ? "E-posta Doğrulandı" : "Doğrulama Başarısız"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{state === "loading" ? "Lütfen bekleyin…" : state === "success" ? "Artık RGNFIX hesabınıza giriş yapabilirsiniz." : message}</p>
        {state !== "loading" && <Link href="/giris"><Button className="mt-6 w-full">Giriş Ekranına Git</Button></Link>}
      </div>
    </AuthCard>
  );
}
