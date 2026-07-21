import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, Ruler, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const guides = [
  { id: "cam-balkon-tek", title: "Cam Balkon – Tek Cam", subtitle: "Her kanadı tek tek ölçün", notes: ["En ve boy cam içinden cam içine alınır.", "Her kanat aynı görünse bile ölçüsü farklı olabilir.", "Açılır kanatta sadece en ölçüsünden 2 cm düşülür."], mount: "Vidalı, kancalı veya yapıştırma" },
  { id: "cam-balkon-cift", title: "Cam Balkon – Çift Cam", subtitle: "Slim kasa için net cam ölçüsü", notes: ["En ve boy net cam boşluğundan alınır.", "Slim kasa seçilir.", "Profil rengi beyaz veya antrasit olmalıdır."], mount: "Vidalı, kancalı veya yapıştırma" },
  { id: "pvc-pencere", title: "PVC Pencere", subtitle: "Kanat camını net ölçün", notes: ["Cam içinden cam içine en ve boy alınır.", "Pay düşmeyin ve yuvarlama yapmayın.", "Kancalı seçilmez; RGN PEN alternatifi kullanılabilir."], mount: "Vidalı, yapıştırma veya RGN PEN" },
  { id: "pvc-kapi", title: "PVC Kapı", subtitle: "Kapı kanadındaki cam alanı", notes: ["Camın sol iç kenarından sağ iç kenarına ölçün.", "Üst iç kenardan alt iç kenara boy alın.", "Kapının açılma kolu ve fitilleri ölçüye dahil edilmez."], mount: "Vidalı, yapıştırma veya RGN PEN" },
  { id: "pvc-surgulu", title: "PVC Sürgülü Kapı", subtitle: "Sürgü hareket alanını kontrol edin", notes: ["Her sürgü kanadını ayrı ölçün.", "En ve boy cam içinden cam içine alınır.", "Perdenin hareketine engel olacak kol veya çıkıntıyı kontrol edin."], mount: "Vidalı, yapıştırma veya RGN PEN" },
  { id: "aluminyum-pencere", title: "Alüminyum Pencere", subtitle: "Alüminyum doğrama net cam ölçüsü", notes: ["Çelik metre kullanın.", "En ve boy değerini santimetre olarak yazın.", "Kancalı ürün seçilmez."], mount: "Vidalı, yapıştırma veya RGN PEN" },
  { id: "aluminyum-kapi", title: "Alüminyum Kapı", subtitle: "Kapı camını ayrı ölçün", notes: ["Camın net enini ve boyunu ölçün.", "Ondalıklı ölçüyü örneğin 56,4 cm şeklinde yazın.", "Kapı kolu ve menteşe boşluğunu kontrol edin."], mount: "Vidalı, yapıştırma veya RGN PEN" },
];

export default function MeasurementVisualGuide() {
  const [active, setActive] = useState(guides[0].id);
  const selected = guides.find(item => item.id === active) || guides[0];

  useEffect(() => {
    document.title = "Plise Perde Ölçüsü Nasıl Alınır? Görsel Ölçü Rehberi | RGNFIX";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    meta.setAttribute("content", "Cam balkon, PVC pencere, PVC kapı, sürgülü kapı ve alüminyum doğrama için görsel plise perde ölçü alma rehberi. Çelik metreyle doğru en ve boy ölçüsü alın.");
  }, []);

  return (
    <div className="container max-w-7xl py-10 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"><Ruler className="h-4 w-4" /> Görsel Ölçü Alma Rehberi</div>
        <h1 className="mt-4 text-3xl font-bold sm:text-5xl">Doğru ölçüyü adım adım alın</h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">Uygulama alanınızı seçin. En ve boy ölçüsünü nereden alacağınızı görsel üzerinde takip edin. Ölçüler çelik metreyle santimetre olarak alınmalı ve yuvarlanmamalıdır.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {guides.map(item => <Button key={item.id} variant={active === item.id ? "default" : "outline"} onClick={() => setActive(item.id)}>{item.title}</Button>)}
      </div>

      <Card className="overflow-hidden"><CardContent className="grid gap-8 p-6 lg:grid-cols-2 lg:p-10">
        <div className="rounded-3xl border bg-gradient-to-br from-slate-100 to-slate-200 p-6 dark:from-slate-900 dark:to-slate-800">
          <VisualFrame title={selected.title} />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">{selected.subtitle}</p>
          <h2 className="mt-2 text-3xl font-bold">{selected.title} ölçüsü</h2>
          <div className="mt-6 space-y-3">
            {selected.notes.map((note, index) => <div key={note} className="flex gap-3 rounded-xl border p-4"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-semibold">Adım {index + 1}</p><p className="mt-1 text-sm text-muted-foreground">{note}</p></div></div>)}
          </div>
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><TriangleAlert className="mr-2 inline h-5 w-5" /><strong>Uygun montaj:</strong> {selected.mount}</div>
          <div className="mt-6 rounded-xl bg-primary/5 p-4 text-sm leading-7">Örnek ölçü 56,4 cm çıkıyorsa <strong>56,4 cm</strong> olarak yazın. 56 veya 57 cm’ye yuvarlamayın.</div>
        </div>
      </CardContent></Card>
    </div>
  );
}

function VisualFrame({ title }: { title: string }) {
  return (
    <div className="relative mx-auto aspect-[4/5] max-w-md rounded-2xl border-[14px] border-slate-700 bg-sky-100 shadow-2xl">
      <div className="absolute inset-4 rounded-lg border-4 border-slate-400 bg-gradient-to-b from-sky-200 to-sky-50" />
      <div className="absolute left-8 right-8 top-1/2 border-t-2 border-dashed border-primary" />
      <div className="absolute bottom-8 top-8 left-1/2 border-l-2 border-dashed border-primary" />
      <div className="absolute left-4 right-4 top-1/2 -translate-y-8 flex items-center justify-between text-primary"><ArrowRight className="h-8 w-8 rotate-180" /><span className="rounded-full bg-background px-3 py-1 text-xs font-bold shadow">EN: cam içinden cam içine</span><ArrowRight className="h-8 w-8" /></div>
      <div className="absolute bottom-4 top-4 left-1/2 translate-x-8 flex flex-col items-center justify-between text-primary"><ArrowDown className="h-8 w-8 rotate-180" /><span className="-rotate-90 whitespace-nowrap rounded-full bg-background px-3 py-1 text-xs font-bold shadow">BOY: üstten alta net ölçü</span><ArrowDown className="h-8 w-8" /></div>
      <div className="absolute bottom-3 left-3 rounded-lg bg-slate-900/85 px-3 py-2 text-xs font-semibold text-white">{title}</div>
    </div>
  );
}
