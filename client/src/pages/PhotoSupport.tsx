import { Link } from "wouter";
import { Eye, ShieldCheck, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PhotoSupport() {
  return (
    <div className="container max-w-xl py-12 sm:py-20">
      <Card className="border-border/60 shadow-lg">
        <CardContent className="p-7 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Eye className="h-7 w-7" /></div>
          <h1 className="mt-5 text-3xl font-serif font-bold">Canlı Kamera Denetimi</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Kamera fotoğraf çekmez ve ölçü tahmini yapmaz. Ölçü alırken çelik metreyi camın doğru noktalarına yerleştirmeniz için sizi uyarır.</p>
          <div className="mt-6 space-y-3 text-left text-sm">
            <div className="flex gap-3 rounded-xl bg-muted/50 p-3"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" /><span>Önce EN, sonra BOY ölçüsünü camdan cama aldırır.</span></div>
            <div className="flex gap-3 rounded-xl bg-muted/50 p-3"><Video className="h-5 w-5 shrink-0 text-primary" /><span>Video kaydı yalnızca müşteri açıkça izin verirse başlar ve siparişe eklenir.</span></div>
          </div>
          <Link href="/olcu-asistani"><Button className="mt-7 h-12 w-full">Canlı Ölçüye Başla</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
