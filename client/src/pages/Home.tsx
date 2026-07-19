import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Bot,
  Ruler,
  Calculator,
  Palette,
  Layers,
  Wrench,
  ShoppingCart,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Activity,
  Gauge,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { href: "/ai-danismani", icon: Bot, label: "AI Danışman", desc: "Yapay zeka ile perde danışmanlığı", color: "from-primary to-cyan-700" },
  { href: "/olcu-asistani", icon: Ruler, label: "Ölçü Asistanı", desc: "Adım adım ölçü alma rehberi", color: "from-secondary to-teal-700" },
  { href: "/fiyat-hesapla", icon: Calculator, label: "Fiyat Hesapla", desc: "Anlık fiyat hesaplama", color: "from-primary to-cyan-700" },
  { href: "/kumas-karsilastirma", icon: Layers, label: "Kumaş Karşılaştır", desc: "Kumaşları yan yana incele", color: "from-secondary to-teal-700" },
  { href: "/renk-danismani", icon: Palette, label: "Renk Danışmanı", desc: "Mekanınıza uygun renkler", color: "from-primary to-cyan-700" },
  { href: "/montaj-rehberi", icon: Wrench, label: "Montaj Rehberi", desc: "Kolay montaj talimatları", color: "from-secondary to-teal-700" },
  { href: "/siparis", icon: ShoppingCart, label: "Sipariş Ver", desc: "Hızlı ve güvenli sipariş", color: "from-primary to-cyan-700" },
  { href: "/bayi-haritasi", icon: MapPin, label: "Bayi Bul", desc: "Size en yakın bayi", color: "from-secondary to-teal-700" },
];

const benefits = [
  "Yapay zeka destekli kişisel danışmanlık",
  "Dakikalar içinde doğru ölçü alma",
  "Anlık fiyat hesaplama ve karşılaştırma",
  "Güvenli online sipariş ve takip",
  "3.000 ₺ üzeri ücretsiz kargo",
  "7/24 destek ve garanti",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as unknown as [number, number, number, number] } },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden future-grid border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background/70 to-secondary/12" />
        <div className="absolute -top-32 right-0 w-[34rem] h-[34rem] bg-secondary/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-0 w-[30rem] h-[30rem] bg-primary/15 rounded-full blur-3xl" />

        <div className="container relative py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] as unknown as [number, number, number, number] }}
            className="grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center"
          >
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 text-primary text-xs font-semibold tracking-wide">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" /></span>
                RGNFIX AKILLI ÖLÇÜ SİSTEMİ • ÇEVRİMİÇİ
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-semibold tracking-[-0.045em] text-balance leading-[1.04]">
                Doğru ölçüden <span className="gradient-text">kolay kuruluma.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                RGNFIX ölçünüzü adım adım doğrular, doğru demonte ürünü eşleştirir ve kurulum sürecini tek merkezden yönetir.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/olcu-asistani">
                  <Button size="lg" className="btn-premium text-base gap-2 h-13 px-7">
                    <ScanLine className="h-4 w-4" />
                    Akıllı Taramayı Başlat
                  </Button>
                </Link>
                <Link href="/ai-danismani">
                  <Button variant="outline" size="lg" className="text-base gap-2 h-13 px-7 rounded-xl bg-background/60 backdrop-blur">
                    AI Danışman
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 max-w-xl">
                {[['%98', 'Ölçü doğruluğu'], ['30 sn', 'Akıllı öneri'], ['7/24', 'AI desteği']].map(([value, label]) => (
                  <div key={label} className="border-l-2 border-secondary/60 pl-3">
                    <strong className="block text-lg text-foreground">{value}</strong>
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative max-w-xl mx-auto w-full">
              <div className="absolute inset-8 bg-secondary/20 blur-3xl rounded-full" />
              <div className="relative glass-card p-5 sm:p-7 shadow-2xl shadow-primary/15">
                <div className="flex items-center justify-between mb-7">
                  <div>
                    <p className="text-[10px] tracking-[0.18em] text-muted-foreground">CANLI KONFİGÜRATÖR</p>
                    <h2 className="text-xl font-semibold mt-1">Salon • Güney Cephe</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-secondary"><Activity className="h-4 w-4" /> Analiz aktif</div>
                </div>

                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/20 bg-gradient-to-br from-[#0b1d33] via-[#102a43] to-[#0fa4a7]/80 p-6 text-white">
                  <div className="absolute inset-0 future-grid opacity-20" />
                  <div className="relative h-full grid grid-cols-[1fr_auto] gap-5">
                    <div className="flex flex-col justify-between">
                      <div className="space-y-1"><p className="text-[10px] text-white/60">IŞIK DENGESİ</p><p className="text-3xl font-semibold">%72</p></div>
                      <div className="space-y-2">
                        <div className="h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full w-[72%] bg-cyan-300 rounded-full" /></div>
                        <p className="text-xs text-white/65">Önerilen: Nano Insulation</p>
                      </div>
                    </div>
                    <div className="relative w-28 sm:w-36 rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-x-4 top-4 bottom-4 flex gap-1.5">
                        {[0,1,2,3,4,5].map(i => <span key={i} className="flex-1 bg-gradient-to-r from-white/80 to-cyan-100/40 skew-y-[-8deg]" />)}
                      </div>
                      <ScanLine className="relative h-8 w-8 text-cyan-200 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-xl bg-muted/60 p-3"><Gauge className="h-4 w-4 text-secondary mb-2" /><p className="text-[10px] text-muted-foreground">ISI KONTROLÜ</p><strong className="text-sm">Yüksek</strong></div>
                  <div className="rounded-xl bg-muted/60 p-3"><ShieldCheck className="h-4 w-4 text-secondary mb-2" /><p className="text-[10px] text-muted-foreground">MAHREMİYET</p><strong className="text-sm">%80</strong></div>
                  <div className="rounded-xl bg-muted/60 p-3"><Sparkles className="h-4 w-4 text-secondary mb-2" /><p className="text-[10px] text-muted-foreground">UYUM</p><strong className="text-sm">Mükemmel</strong></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
              Size Nasıl Yardımcı Olabiliriz?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              İhtiyacınıza göre aşağıdaki araçlardan birini seçin
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.href} variants={item}>
                  <Link href={feature.href}>
                    <Card className="group cursor-pointer h-full border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                      <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{feature.label}</h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-bold">
                Neden RGNFIX?
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Ölçü, ürün seçimi ve kurulum sürecinizi baştan sona dijitalleştiriyoruz. Yapay zekâ ile
                size en uygun demonte çözümü saniyeler içinde sunuyoruz.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
              <Link href="/olcu-asistani">
                <Button className="btn-premium gap-2 mt-4">
                  Hemen Başla
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-square max-w-md mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/25 rounded-3xl rotate-3" />
                <div className="absolute inset-0 bg-gradient-to-tl from-primary/10 to-secondary/15 rounded-3xl -rotate-3" />
                <div className="relative bg-card rounded-3xl border shadow-2xl p-8 flex flex-col items-center justify-center h-full">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold mb-2">AI Danışman</h3>
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    "Evim çok güneş alıyor, hangi kumaşı önerirsiniz?"
                  </p>
                  <div className="mt-6 w-full space-y-2">
                    <div className="h-2 bg-primary/20 rounded-full w-full" />
                    <div className="h-2 bg-primary/10 rounded-full w-3/4" />
                    <div className="h-2 bg-primary/5 rounded-full w-1/2" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-slate-800 to-secondary p-10 lg:p-16 text-center"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            <div className="relative space-y-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                Perdenizi Şimdi Tasarlayın
              </h2>
              <p className="text-white/80 text-lg max-w-xl mx-auto">
                Yapay zeka danışmanımız size en uygun plise perdeyi bulmak için hazır.
                Ücretsiz danışmanlık alın.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/ai-danismani">
                  <Button size="lg" variant="secondary" className="text-base gap-2 h-12 px-8 rounded-xl">
                    <Bot className="h-4 w-4" />
                    Ücretsiz Danışmanlık
                  </Button>
                </Link>
                <Link href="/siparis">
                  <Button size="lg" variant="outline" className="text-base gap-2 h-12 px-8 rounded-xl border-white/30 text-white hover:bg-white/10">
                    <ShoppingCart className="h-4 w-4" />
                    Sipariş Ver
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
