import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, LockKeyhole, Mail, LogIn, Phone, RefreshCw, UserPlus } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setVerificationPending(false);

    if (!email.trim() || !password) return;
    if (mode === "register") {
      if (!name.trim()) {
        setError("Ad soyad alanı zorunludur.");
        return;
      }
      if (password !== passwordAgain) {
        setError("Şifreler birbiriyle eşleşmiyor.");
        return;
      }
      if (!acceptedLegal) {
        setError("Hesap oluşturmak için Kullanım Koşulları ve Gizlilik Politikası kabul edilmelidir.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/local-auth/register" : "/api/local-auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          termsAccepted: acceptedLegal,
          privacyAccepted: acceptedLegal,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        role?: "user" | "admin";
        verificationRequired?: boolean;
        emailVerificationRequired?: boolean;
      };
      if (!response.ok) {
        if (data.emailVerificationRequired) setVerificationPending(true);
        throw new Error(data.error || (mode === "register" ? "Kayıt oluşturulamadı." : "Giriş yapılamadı."));
      }

      if (data.verificationRequired) {
        setMode("login");
        setPassword("");
        setPasswordAgain("");
        setVerificationPending(true);
        setNotice("Hesabınız oluşturuldu. Giriş yapmadan önce e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.");
        return;
      }

      window.location.href = data.role === "admin" ? "/yonetici" : "/hesabim";
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email.trim()) {
      setError("Önce e-posta adresinizi yazın.");
      return;
    }
    setResending(true);
    setError("");
    try {
      await fetch("/api/local-auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setNotice("E-posta adresiniz kayıtlı ve doğrulanmamışsa yeni bağlantı gönderildi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="container max-w-md py-10 sm:py-16">
      <Card className="overflow-hidden border-border/60 shadow-lg">
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex justify-center">
            <BrandLogo className="h-14" />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-serif font-bold">
              {mode === "login" ? "Hesabınıza Giriş Yapın" : "Ücretsiz Hesap Oluşturun"}
            </h1>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); setNotice(""); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); setNotice(""); setVerificationPending(false); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "register" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="h-11 pl-10" placeholder="Adınız Soyadınız" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" className="h-11 pl-10" placeholder="05XX XXX XX XX" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="h-11 pl-10" placeholder="ornek@email.com" required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Şifre</Label>
                {mode === "login" && <Link href="/sifremi-unuttum"><span className="cursor-pointer text-xs font-medium text-primary hover:underline">Şifremi Unuttum</span></Link>}
              </div>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} className="h-11 pl-10" placeholder="En az 8 karakter" minLength={8} required />
              </div>
            </div>

            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="passwordAgain">Şifre Tekrar</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="passwordAgain" type="password" value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} autoComplete="new-password" className="h-11 pl-10" placeholder="Şifrenizi tekrar yazın" minLength={8} required />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 text-xs leading-5">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={acceptedLegal} onChange={event => setAcceptedLegal(event.target.checked)} />
                  <span><Link href="/kullanim-kosullari"><strong className="text-primary hover:underline">Kullanım Koşulları</strong></Link> ve <Link href="/gizlilik-politikasi"><strong className="text-primary hover:underline">Gizlilik Politikası</strong></Link> metinlerini okudum ve kabul ediyorum.</span>
                </label>
              </>
            )}

            {notice && (
              <div className="flex gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {verificationPending && mode === "login" && (
              <Button type="button" variant="outline" className="w-full gap-2" onClick={resendVerification} disabled={resending}>
                <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                Doğrulama E-postasını Yeniden Gönder
              </Button>
            )}

            <Button type="submit" className="h-11 w-full gap-2" disabled={loading}>
              {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "İşlem yapılıyor..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
