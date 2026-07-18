import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  Ruler,
  Calculator,
  Palette,
  Bot,
  Layers,
  Wrench,
  ShoppingCart,
  MapPin,
  LayoutDashboard,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { href: "/ai-danismani", label: "AI Danışman", icon: Bot },
  { href: "/olcu-asistani", label: "Ölçü Asistanı", icon: Ruler },
  { href: "/fiyat-hesapla", label: "Fiyat Hesapla", icon: Calculator },
  { href: "/kumas-karsilastirma", label: "Kumaşlar", icon: Layers },
  { href: "/renk-danismani", label: "Renk Danışmanı", icon: Palette },
  { href: "/montaj-rehberi", label: "Montaj Rehberi", icon: Wrench },
  { href: "/siparis", label: "Sipariş", icon: ShoppingCart },
  { href: "/bayi-haritasi", label: "Bayiler", icon: MapPin },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountHref = user?.role === "admin" ? "/yonetici" : "/hesabim";
  const accountLabel = user?.role === "admin" ? "Yönetim" : user?.name || "Hesabım";
  const AccountIcon = user?.role === "admin" ? LayoutDashboard : User;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="group h-11 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
            <BrandLogo className="h-11" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.slice(0, 6).map(item => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    location === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-[10px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
              AI ÇEVRİMİÇİ
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-lg">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link href={accountHref}>
                  <Button variant="ghost" size="sm" className="rounded-lg gap-2">
                    <AccountIcon className="h-4 w-4" />
                    <span className="max-w-28 truncate">{accountLabel}</span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => logout()} className="rounded-lg" aria-label="Çıkış yap">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" onClick={() => startLogin()} className="hidden sm:flex rounded-lg">
                Giriş Yap
              </Button>
            )}

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden rounded-lg">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-serif text-lg font-semibold">
                      <span className="font-black tracking-tight text-primary">RGN<span className="text-secondary">FIX</span></span>
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                          <span
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                              location === item.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                  <div className="p-4 border-t space-y-2">
                    {isAuthenticated ? (
                      <>
                        <Link href={accountHref} onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full justify-start gap-2">
                            <AccountIcon className="h-4 w-4" />
                            {accountLabel}
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => logout()}>
                          <LogOut className="h-4 w-4" />
                          Çıkış Yap
                        </Button>
                      </>
                    ) : (
                      <Button className="w-full" onClick={() => startLogin()}>
                        Giriş Yap / Kayıt Ol
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2"><BrandLogo className="h-12" /></div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Akıllı ölçü ve demonte ürün platformu. Doğru ölçüden kolay kuruluma kadar güvenilir dijital deneyim.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Hizmetler</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/ai-danismani"><span className="block hover:text-foreground transition-colors cursor-pointer">AI Danışman</span></Link>
                <Link href="/olcu-asistani"><span className="block hover:text-foreground transition-colors cursor-pointer">Ölçü Asistanı</span></Link>
                <Link href="/fiyat-hesapla"><span className="block hover:text-foreground transition-colors cursor-pointer">Fiyat Hesaplama</span></Link>
                <Link href="/siparis"><span className="block hover:text-foreground transition-colors cursor-pointer">Online Sipariş</span></Link>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Bilgi</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/kumas-karsilastirma"><span className="block hover:text-foreground transition-colors cursor-pointer">Kumaş Rehberi</span></Link>
                <Link href="/montaj-rehberi"><span className="block hover:text-foreground transition-colors cursor-pointer">Montaj Rehberi</span></Link>
                <Link href="/renk-danismani"><span className="block hover:text-foreground transition-colors cursor-pointer">Renk Danışmanı</span></Link>
                <Link href="/bayi-haritasi"><span className="block hover:text-foreground transition-colors cursor-pointer">Bayi Bul</span></Link>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">İletişim</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Dijital destek merkezi</p>
                <a href="tel:+905300288903" className="block hover:text-foreground transition-colors">+90 530 028 89 03</a>
                <p>Türkiye geneli hizmet</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} RGNFIX. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
