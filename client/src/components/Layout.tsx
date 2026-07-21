import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Sun, Moon, User, LogOut, Ruler, Calculator, Palette, Bot, Layers, Wrench, ShoppingCart, LayoutDashboard, Settings, Grid2X2, Search, WalletCards, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  { href: "/ai-danismani", label: "AI Danışman", icon: Bot },
  { href: "/olcu-asistani", label: "Ölçü Asistanı", icon: Ruler },
  { href: "/fiyat-hesapla", label: "Fiyat Hesapla", icon: Calculator },
  { href: "/kumas-karsilastirma", label: "Plise Perde", icon: Layers },
  { href: "/sineklik", label: "Sineklik", icon: Grid2X2 },
  { href: "/renk-danismani", label: "Renk Danışmanı", icon: Palette },
  { href: "/montaj-rehberi", label: "Montaj Rehberi", icon: Wrench },
  { href: "/siparis", label: "Sipariş", icon: ShoppingCart },
  { href: "/siparis-sorgula", label: "Sipariş Sorgula", icon: Search },
];

const SEO: Record<string, { title: string; description: string }> = {
  "/": { title: "RGNFIX | Cam Balkon Plise Perde ve Akıllı Online Sipariş", description: "Cam balkon, PVC ve alüminyum doğramalar için ölçüye özel plise perde. Anlık fiyat, online sipariş ve 3000 TL üzeri ücretsiz kargo." },
  "/siparis": { title: "Online Plise Perde Siparişi | RGNFIX", description: "Ölçünüzü girin, kumaş ve montaj tipini seçin, plise perde siparişinizi online oluşturun. Türkiye geneli gönderim." },
  "/fiyat-hesapla": { title: "Plise Perde Fiyat Hesaplama 2026 | RGNFIX", description: "Nova, Neo Fashion, Nano Clean, Nano Insulation ve Nano Pro fiyatlarını ölçünüze göre anında hesaplayın." },
  "/sineklik": { title: "Akordiyon Sineklik Fiyatları | Kapı ve Pencere Sinekliği", description: "Kapı ve pencere için ölçüye özel akordiyon sineklik. Fiber tül, kolay kullanım ve Türkiye geneli sipariş desteği." },
  "/renk-danismani": { title: "Plise Perde Renk ve Varyant Önerici | RGNFIX", description: "Duvar, zemin ve mobilya renginize uygun plise perde serisini ve VR varyantını bulun." },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountHref = user?.role === "admin" ? "/yonetici" : "/hesabim";
  const accountLabel = user?.role === "admin" ? "Yönetim" : user?.name || "Hesabım";
  const AccountIcon = user?.role === "admin" ? LayoutDashboard : User;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const seo = SEO[location] || SEO["/"];
    document.title = seo.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", seo.description);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="bg-primary text-primary-foreground">
        <div className="container flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-2 text-center text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1.5 font-bold"><Truck className="h-4 w-4" /> 3.000 TL ve üzeri ÜCRETSİZ KARGO</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> 2 yıl garanti</span>
          <span className="inline-flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Kapıda ödeme</span>
          <Link href="/fiyat-hesapla"><span className="cursor-pointer rounded-full bg-white/15 px-3 py-1 font-semibold hover:bg-white/25">Anlık fiyat al →</span></Link>
        </div>
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="group h-11 transition-transform duration-200 hover:scale-[1.02]"><BrandLogo className="h-11" /></Link>
          <nav className="hidden lg:flex items-center gap-1">{navItems.slice(0, 6).map(item => <Link key={item.href} href={item.href}><span className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer ${location === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>{item.label}</span></Link>)}</nav>
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1.5 text-[10px] font-semibold text-primary"><span className="h-1.5 w-1.5 rounded-full bg-secondary" />DİJİTAL PLATFORM</div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Tema değiştir">{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            {isAuthenticated ? <div className="hidden sm:flex items-center gap-2"><Link href={accountHref}><Button variant="ghost" size="sm" className="gap-2"><AccountIcon className="h-4 w-4" />{accountLabel}</Button></Link>{user?.role === "admin" && <Link href="/yonetici/fiyatlar"><Button variant="ghost" size="icon"><WalletCards className="h-4 w-4" /></Button></Link>}{user?.role === "user" && <Link href="/hesap-ayarlari"><Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button></Link>}<Button variant="ghost" size="icon" onClick={() => logout()}><LogOut className="h-4 w-4" /></Button></div> : <Button size="sm" onClick={() => startLogin()} className="hidden sm:flex">Giriş Yap</Button>}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger><SheetContent side="right" className="w-80 p-0"><div className="flex h-full flex-col"><div className="flex items-center justify-between border-b p-4"><BrandLogo className="h-10" /><Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="h-4 w-4" /></Button></div><nav className="flex-1 space-y-1 overflow-y-auto p-4">{navItems.map(item => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}><span className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${location === item.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"}`}><Icon className="h-4 w-4" />{item.label}</span></Link>; })}</nav><div className="space-y-2 border-t p-4">{isAuthenticated ? <><Link href={accountHref}><Button variant="outline" className="w-full justify-start gap-2"><AccountIcon className="h-4 w-4" />{accountLabel}</Button></Link>{user?.role === "admin" && <Link href="/yonetici/fiyatlar"><Button variant="outline" className="w-full justify-start gap-2"><WalletCards className="h-4 w-4" />Fiyat Yönetimi</Button></Link>}<Button variant="ghost" className="w-full justify-start gap-2" onClick={() => logout()}><LogOut className="h-4 w-4" />Çıkış Yap</Button></> : <Button className="w-full" onClick={() => startLogin()}>Giriş Yap / Kayıt Ol</Button>}</div></div></SheetContent></Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/50 bg-muted/30"><div className="container py-12"><div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5"><div className="space-y-3"><BrandLogo className="h-12" /><p className="text-sm text-muted-foreground">Akıllı ölçü ve demonte ürün platformu.</p></div><div><h4 className="mb-3 font-semibold text-sm">Hizmetler</h4><div className="space-y-2 text-sm text-muted-foreground"><Link href="/ai-danismani">AI Danışman</Link><br/><Link href="/olcu-asistani">Ölçü Asistanı</Link><br/><Link href="/fiyat-hesapla">Fiyat Hesaplama</Link><br/><Link href="/siparis-sorgula">Sipariş Sorgulama</Link></div></div><div><h4 className="mb-3 font-semibold text-sm">Ürünler</h4><div className="space-y-2 text-sm text-muted-foreground"><Link href="/kumas-karsilastirma">Plise Perde</Link><br/><Link href="/sineklik">Sineklik</Link><br/><Link href="/montaj-rehberi">Montaj Rehberi</Link></div></div><div><h4 className="mb-3 font-semibold text-sm">Yasal</h4><div className="space-y-2 text-sm text-muted-foreground"><Link href="/gizlilik-politikasi">Gizlilik Politikası</Link><br/><Link href="/kullanim-kosullari">Kullanım Koşulları</Link><br/><Link href="/kvkk-aydinlatma">KVKK</Link></div></div><div><h4 className="mb-3 font-semibold text-sm">İletişim</h4><div className="space-y-2 text-sm text-muted-foreground"><p>Dijital destek merkezi</p><a href="tel:+905300288903">+90 530 028 89 03</a><p>Türkiye geneli hizmet</p></div></div></div><div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} RGNFIX by Plise Perde Gaziantep.</div></div></footer>
    </div>
  );
}
