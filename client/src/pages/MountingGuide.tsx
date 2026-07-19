import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle2, AlertTriangle, Play, Ruler } from "lucide-react";

const mountingGuides = [
  {
    id: "kancali",
    name: "Kancalı Montaj (Cam Balkon)",
    difficulty: "Kolay",
    time: "5-10 dk",
    tools: ["Kanca seti (dahil)"],
    steps: [
      "Perde paketten dikkatli bir şekilde çıkarılır.",
      "Streçleri sökülür, iplerin birbirine dolaşmaması için özen gösterilir.",
      "Kancalar üst baza boşluğuna yerleştirilir.",
      "Daha sonra alt baza boşluğuna kancalar yerleştirilir.",
      "Son olarak perdeyi istediğiniz pozisyona getirin.",
    ],
    tips: [
      "İplerin dolaşmaması için streçleri dikkatli sökün",
      "Önce üst sonra alt kancaları takın",
      "Kancalı montaj sökülebilir avantaj sağlar",
    ],
    mistakes: [
      "İpleri birbirine dolaştırmak",
      "Kancaları yanlış sıraya takmak",
      "Perdeyi zorla çekmek",
    ],
    videoUrl: "https://www.youtube.com/shorts/wBGzDru7sdA",
  },
  {
    id: "vidali-cam-balkon",
    name: "Vidalı Montaj (Cam Balkon)",
    difficulty: "Orta",
    time: "15-20 dk",
    tools: ["Matkap", "2.5 mm delici tığ", "PH1 matkap ucu", "Kalem", "Aparat seti (dahil)"],
    steps: [
      "Aparat delinecek yere konulur ve kalemle işaretlenir.",
      "2.5 mm delici tığ ile kanadın dört bir tarafı delinir.",
      "PH1 matkap ucuyla aparatlar vidayla tutturulur.",
      "Vidananan aparatlara ip kilidi kızaktan geçirilir.",
      "İp aparat videodaki gibi yapılır.",
      "Son olarak perdeyi istediğiniz pozisyona getirin.",
    ],
    tips: [
      "Delme öncesi kalemle işaretlemeyi unutmayın",
      "2.5 mm tığ kullanın — daha kalın tığ camı çatlatabilir",
      "Aparatları sıkıca vidalayın",
    ],
    mistakes: [
      "İşaretlemeden delme yapmak",
      "Yanlış matkap ucu kullanmak",
      "Aparatları gevşek bırakmak",
    ],
    videoUrl: "https://www.youtube.com/shorts/oy-Qd4mTOO8",
  },
  {
    id: "vidali-pvc",
    name: "Vidalı Montaj (PVC/Alüminyum)",
    difficulty: "Orta",
    time: "15-20 dk",
    tools: ["Matkap", "PH1 matkap ucu", "Kalem", "Aparat seti (dahil)"],
    steps: [
      "Aparat delinecek yere konulur ve kalemle işaretlenir.",
      "PH1 matkap ucuyla aparatlar doğrudan vidayla tutturulur.",
      "Vidananan aparatlara ip kilidi kızaktan geçirilir.",
      "İp aparat videodaki gibi yapılır.",
      "Son olarak perdeyi istediğiniz pozisyona getirin.",
    ],
    tips: [
      "PVC ve alüminyum doğramada aynı yöntem uygulanır",
      "Delme öncesi kalemle işaretlemeyi unutmayın",
      "Aparatları sıkıca vidalayın",
      "PVC'de delici tığa gerek yoktur, doğrudan vidalanabilir",
    ],
    mistakes: [
      "İşaretlemeden delme yapmak",
      "Yanlış matkap ucu kullanmak",
      "Aparatları gevşek bırakmak",
    ],
    videoUrl: "https://www.youtube.com/shorts/wa8_-qHx8P8",
  },
  {
    id: "yapisma",
    name: "Yapıştırmalı Montaj",
    difficulty: "Çok Kolay",
    time: "3-5 dk",
    tools: ["Yapıştırıcı bant (dahil)", "Temizleme bezi"],
    steps: [
      "Yapıştırma yüzeyini alkol ile iyice temizleyin.",
      "Yüzeyin tamamen kuru olduğundan emin olun.",
      "Yapıştırıcı bantın koruyucu kağıdını çıkarın.",
      "Profili yüzeye hizalayarak bastırın.",
      "30 saniye boyunca sıkıca bastırın.",
      "24 saat boyunca perdeyi kullanmayın (yapışkanın oturması için).",
    ],
    tips: [
      "Yüzey temizliği yapışma gücü için kritiktir",
      "Kiracılar için ideal çözüm — iz bırakmaz",
      "Cam balkona, PVC ve alüminyum doğramaya uygulanabilir",
    ],
    mistakes: [
      "Yüzeyi temizlememek",
      "Yapıştırdıktan hemen sonra kullanmak",
      "Soğuk ortamda monte etmek",
    ],
    videoUrl: null,
  },
];

const measurementVideos = [
  {
    title: "Cam Balkon Ölçü Alma (Vidalı & Kancalı)",
    description: "Cam balkonda vidalı ve kancalı montaj için ölçü nasıl alınır",
    url: "https://www.youtube.com/shorts/JgzJHSxcPEQ",
  },
  {
    title: "PVC/Alüminyum ve Sürgülü Cam Ölçü Alma",
    description: "PVC pencere, alüminyum doğrama ve sürgülü camlarda ölçü nasıl alınır",
    url: "https://www.youtube.com/shorts/YJqcTosXrZ4",
  },
];

export default function MountingGuide() {
  const [activeTab, setActiveTab] = useState("kancali");
  const activeGuide = mountingGuides.find((g) => g.id === activeTab)!;

  return (
    <div className="container py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-sm font-medium mb-4">
          <Wrench className="h-3.5 w-3.5" />
          Adım Adım Rehber
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Montaj Rehberi</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Montaj tipinize göre adım adım kurulum talimatları ve video rehberleri
        </p>
      </div>

      {/* Ölçü Videoları */}
      <Card className="border-border/50 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            Ölçü Alma Videoları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {measurementVideos.map((video, i) => (
              <a
                key={i}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <Play className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.description}</p>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
          {mountingGuides.map((guide) => (
            <TabsTrigger key={guide.id} value={guide.id} className="text-xs sm:text-sm">
              {guide.name.split("(")[0].trim()}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          {/* Header Info */}
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-1">Zorluk: {activeGuide.difficulty}</Badge>
            <Badge variant="secondary" className="gap-1">Süre: {activeGuide.time}</Badge>
            {activeGuide.name.includes("Cam Balkon") && <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Cam Balkon</Badge>}
            {activeGuide.name.includes("PVC") && <Badge className="bg-green-500/10 text-green-600 border-green-200">PVC/Alüminyum</Badge>}
          </div>

          {/* Tools */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gerekli Malzemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeGuide.tools.map((tool, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-muted text-sm">{tool}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Steps */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Montaj Adımları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {activeGuide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Video */}
          {activeGuide.videoUrl && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                <a
                  href={activeGuide.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm font-medium text-primary hover:underline"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Play className="h-4 w-4 text-red-500" />
                  </div>
                  Video ile İzle: {activeGuide.name}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Tips & Mistakes */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  İpuçları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {activeGuide.tips.map((tip, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-green-500 shrink-0">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-500">
                  <AlertTriangle className="h-4 w-4" />
                  Sık Yapılan Hatalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {activeGuide.mistakes.map((mistake, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-red-500 shrink-0">•</span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
