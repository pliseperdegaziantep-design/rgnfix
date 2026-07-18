import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, Mail, LogIn, Phone, UserPlus } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

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
    }

    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/local-auth/register" : "/api/local-auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        role?: "user" | "admin";
      };
      if (!response.ok) {
        throw new Error(data.error || (mode === "register" ? "Kayıt oluşturulamadı." : "Giriş yapılamadı."));
      }

      window.location.href = data.role === "admin" ? "/yonetici" : "/hesabim";
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem tamamlanamadı.");
    } finally {
      setLoading(false);
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
            <p className="mt-2 text-sm text-muted-foreground">
              Siparişlerinizi takip edin, profilinizi yönetin ve 24 saat içinde iptal talebi oluşturun.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
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
                    <Input
                      id="name"
                      value={name}
                      onChange={event => setName(event.target.value)}
                      autoComplete="name"
                      className="h-11 pl-10"
                      placeholder="Adınız Soyadınız"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={event => setPhone(event.target.value)}
                      autoComplete="tel"
                      className="h-11 pl-10"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  className="h-11 pl-10"
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="h-11 pl-10"
                  placeholder="En az 8 karakter"
                  minLength={8}
                  required
                />
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="passwordAgain">Şifre Tekrar</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="passwordAgain"
                    type="password"
                    value={passwordAgain}
                    onChange={event => setPasswordAgain(event.target.value)}
                    autoComplete="new-password"
                    className="h-11 pl-10"
                    placeholder="Şifrenizi tekrar yazın"
                    minLength={8}
                    required
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full gap-2" disabled={loading}>
              {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading
                ? "İşlem yapılıyor..."
                : mode === "login"
                  ? "Giriş Yap"
                  : "Hesap Oluştur"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Yönetici hesabı da aynı giriş ekranını kullanır.
          </p>
        </div>
      </Card>
    </div>
  );
}
