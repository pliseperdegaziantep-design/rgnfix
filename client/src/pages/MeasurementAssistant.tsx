import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ruler, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Video, Volume2 } from "lucide-react";
import { MOUNT_TYPES, WINDOW_TYPES, CASE_TYPES, MEASUREMENT_INSTRUCTIONS } from "@shared/types";
import { Link } from "wouter";
import VideoMeasureHelper from "@/components/VideoMeasureHelper";
import VoiceMeasureGuide from "@/components/VoiceMeasureGuide";

interface MeasurementState {
  windowType: string;
  mountType: string;
  caseType: string;
  width: string;
  height: string;
  windowCount: string;
  panels: { width: string; height: string; isOpenable: boolean }[];
}

const steps = [
  { id: 1, title: "Cam Tipi", desc: "Cam tipinizi seçin" },
  { id: 2, title: "Ölçüler", desc: "Genişlik ve yükseklik girin" },
  { id: 3, title: "Montaj & Kasa", desc: "Montaj ve kasa tipini seçin" },
  { id: 4, title: "Sonuç", desc: "Ölçüleriniz hazır" },
];

const measurementWindowTypes = [
  { id: "cam-balkon", name: "Cam Balkon", description: "Katlanır cam balkon sistemi" },
  { id: "standart", name: "Standart Pencere/Kapı", description: "PVC doğrama pencere ve kapı sistemi" },
  { id: "aluminyum", name: "Alüminyum Pencere/Kapı", description: "Alüminyum doğrama pencere ve kapı sistemi" },
  { id: "surgulu-kapi", name: "Sürgülü Pencere/Kapı", description: "Sürgülü cam pencere ve kapı sistemi" },
] as const;

const defaultWindowVisual = {
  image: "/measurement/prepare.png",
  alt: "Cam sistemini ölçüye hazırlama",
  title: "Önce ölçüm alanını hazırlayın",
  description: "Cam çıtalarını temizleyin, kolları kapatın ve doğru cam tipini seçin.",
};

const windowTypeVisuals: Record<string, typeof defaultWindowVisual> = {
  "cam-balkon": {
    image: "/measurement/cam-balkon-v2.png",
    alt: "Kanatları ve içe açılan paneli görünen katlanır cam balkon sistemi",
    title: "Cam balkon kanatlarını kontrol edin",
    description: "Tüm cam kanatları soldan sağa numaralandırın; içe açılan ilk kanadı ayrıca işaretleyin.",
  },
  standart: {
    image: "/measurement/standart-pencere-kapi-v2.png",
    alt: "Standart PVC çift kanatlı pencere ve tam boy balkon kapısı",
    title: "Standart pencere ve kapı ölçüsüne hazırlanın",
    description: "Pencere ve kapı kollarını kapatın; her camın genişlik ve yüksekliğini iç çıtalar arasından ayrı ölçün.",
  },
  aluminyum: {
    image: "/measurement/aluminyum-pencere-kapi.png",
    alt: "Alüminyum pencere ve kapı sistemi",
    title: "Alüminyum doğrama ölçüsüne hazırlanın",
    description: "Pencere veya kapıyı kapatın; genişlik ile yüksekliği iç cam çıtaları arasından ölçün.",
  },
  "surgulu-kapi": {
    image: "/measurement/surgulu-pencere-kapi-v2.png",
    alt: "Yükseltilmiş sürgülü pencere ve tam boy sürgülü balkon kapısı",
    title: "Sürgülü pencere ve kapı ölçüsüne hazırlanın",
    description: "Pencere ve kapı kanatlarını kapatın; her camın genişlik ve yüksekliğini ayrı ayrı ölçün.",
  },
};

export default function MeasurementAssistant() {
  const [step, setStep] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [data, setData] = useState<MeasurementState>({
    windowType: "",
    mountType: "",
    caseType: "kalin",
    width: "",
    height: "",
    windowCount: "1",
    panels: [{ width: "", height: "", isOpenable: false }],
  });

  const canProceed = () => {
    switch (step) {
      case 1: return !!data.windowType;
      case 2:
        if (data.windowType === "cam-balkon") {
          return data.panels.some((p) => parseFloat(p.width) > 0 && parseFloat(p.height) > 0);
        }
        return !!data.width && !!data.height && parseFloat(data.width) > 0 && parseFloat(data.height) > 0;
      case 3: return !!data.mountType && !!data.caseType;
      default: return true;
    }
  };

  const selectedWindow = measurementWindowTypes.find((w) => w.id === data.windowType)
    ?? WINDOW_TYPES.find((w) => w.id === data.windowType);
  const selectedWindowVisual = windowTypeVisuals[data.windowType] ?? defaultWindowVisual;
  const instruction = MEASUREMENT_INSTRUCTIONS.find((i) => i.windowType === data.windowType);
  const availableMounts = instruction
    ? MOUNT_TYPES.filter((m) => instruction.mountOptions.includes(m.id))
    : MOUNT_TYPES;

  const handleCapture = (imageData: string) => {
    setCapturedPhotos((prev) => [...prev, imageData]);
  };

  const addPanel = () => {
    setData((prev) => ({
      ...prev,
      panels: [...prev.panels, { width: "", height: "", isOpenable: false }],
    }));
  };

  const updatePanel = (index: number, field: string, value: string | boolean) => {
    setData((prev) => {
      const panels = [...prev.panels];
      panels[index] = { ...panels[index], [field]: value };
      return { ...prev, panels };
    });
  };

  const removePanel = (index: number) => {
    if (data.panels.length > 1) {
      setData((prev) => ({
        ...prev,
        panels: prev.panels.filter((_, i) => i !== index),
      }));
    }
  };

  // Toplam genişlik ve yükseklik hesapla (cam balkon için)
  const getTotalMeasurements = () => {
    if (data.windowType === "cam-balkon") {
      const validPanels = data.panels.filter((p) => parseFloat(p.width) > 0 && parseFloat(p.height) > 0);
      const totalWidth = validPanels.reduce((sum, p) => {
        const w = parseFloat(p.width);
        return sum + (p.isOpenable ? w - 2 : w);
      }, 0);
      const avgHeight = validPanels.length > 0
        ? validPanels.reduce((sum, p) => sum + parseFloat(p.height), 0) / validPanels.length
        : 0;
      return { width: totalWidth, height: avgHeight, count: validPanels.length };
    }
    return { width: parseFloat(data.width) || 0, height: parseFloat(data.height) || 0, count: parseInt(data.windowCount) || 1 };
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Ruler className="h-3.5 w-3.5" />
          Profesyonel Ölçü Rehberi
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
          Akıllı Ölçü Asistanı
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Sesli rehberlik ve görüntülü yardım ile profesyonel ölçü alın
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step > s.id
                  ? "bg-primary text-primary-foreground"
                  : step === s.id
                  ? "bg-primary/10 text-primary border-2 border-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${step > s.id ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-serif">
                {steps[step - 1].title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{steps[step - 1].desc}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="overflow-hidden rounded-2xl border bg-muted/20" aria-live="polite">
                  <img
                    key={selectedWindowVisual.image}
                    src={selectedWindowVisual.image}
                    alt={selectedWindowVisual.alt}
                    className="w-full aspect-[16/9] object-cover animate-in fade-in duration-300"
                  />
                  <div className="p-4">
                    <p className="text-sm font-semibold">{selectedWindowVisual.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedWindowVisual.description}</p>
                  </div>
                </div>
              )}

              {step === 2 && data.windowType !== "cam-balkon" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <figure className="overflow-hidden rounded-2xl border bg-card">
                    <img src="/measurement/width.png" alt="Cam içi genişlik ölçümü" className="w-full aspect-[4/3] object-cover" />
                    <figcaption className="p-3 text-xs"><strong className="block text-sm mb-1">1. Genişliği ölçün</strong>Metreyi iç cam çıtasından karşı iç cam çıtasına düz tutun.</figcaption>
                  </figure>
                  <figure className="overflow-hidden rounded-2xl border bg-card">
                    <img src="/measurement/height.png" alt="Cam içi yükseklik ölçümü" className="w-full aspect-[4/3] object-cover" />
                    <figcaption className="p-3 text-xs"><strong className="block text-sm mb-1">2. Yüksekliği ölçün</strong>Üst iç cam çıtasından alt iç cam çıtasına dik ölçün.</figcaption>
                  </figure>
                </div>
              )}

              {/* Step 1: Window Type */}
              {step === 1 && (
                <RadioGroup value={data.windowType} onValueChange={(v) => setData({ ...data, windowType: v, mountType: "", panels: [{ width: "", height: "", isOpenable: false }] })}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {measurementWindowTypes.map((wt) => (
                      <Label
                        key={wt.id}
                        htmlFor={wt.id}
                        className={`flex flex-col gap-1 p-4 rounded-xl border cursor-pointer transition-all ${
                          data.windowType === wt.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={wt.id} id={wt.id} />
                          <span className="font-medium text-sm">{wt.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-7">{wt.description}</span>
                      </Label>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {/* Step 2: Measurements */}
              {step === 2 && (
                <div className="space-y-6">
                  {/* Important notes for selected window type */}
                  {instruction && (
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          <p className="font-medium mb-1">
                            {selectedWindow?.name} — Ölçü Kuralları:
                          </p>
                          <ul className="space-y-1 text-xs">
                            {instruction.importantNotes.map((note, i) => (
                              <li key={i}>• {note}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cam Balkon - Multi panel */}
                  {data.windowType === "cam-balkon" ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Kanat Ölçüleri</Label>
                        <Button size="sm" variant="outline" onClick={addPanel} className="text-xs rounded-lg">
                          + Kanat Ekle
                        </Button>
                      </div>
                      {data.panels.map((panel, i) => (
                        <div key={i} className="p-3 rounded-lg border border-border/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Kanat {i + 1}</span>
                            {data.panels.length > 1 && (
                              <Button size="sm" variant="ghost" onClick={() => removePanel(i)} className="text-xs h-6 px-2 text-red-500">
                                Kaldır
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Genişlik (cm)</Label>
                              <Input
                                type="number"
                                placeholder="Örn: 60"
                                value={panel.width}
                                onChange={(e) => updatePanel(i, "width", e.target.value)}
                                className="rounded-lg h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Yükseklik (cm)</Label>
                              <Input
                                type="number"
                                placeholder="Örn: 150"
                                value={panel.height}
                                onChange={(e) => updatePanel(i, "height", e.target.value)}
                                className="rounded-lg h-9 text-sm"
                              />
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={panel.isOpenable}
                              onChange={(e) => updatePanel(i, "isOpenable", e.target.checked)}
                              className="rounded border-border"
                            />
                            <span className="text-xs text-muted-foreground">
                              Açılır kanat (kollu/zincirli) — 2 cm pay düşülür
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Standard measurement */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="width">Genişlik (cm)</Label>
                          <Input
                            id="width"
                            type="number"
                            placeholder="Örn: 120"
                            value={data.width}
                            onChange={(e) => setData({ ...data, width: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="height">Yükseklik (cm)</Label>
                          <Input
                            id="height"
                            type="number"
                            placeholder="Örn: 150"
                            value={data.height}
                            onChange={(e) => setData({ ...data, height: e.target.value })}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="count">Pencere Adedi</Label>
                        <Input
                          id="count"
                          type="number"
                          min="1"
                          value={data.windowCount}
                          onChange={(e) => setData({ ...data, windowCount: e.target.value })}
                          className="rounded-xl w-24"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Mount & Case Type */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Mount Type */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Montaj Tipi</Label>
                    <RadioGroup value={data.mountType} onValueChange={(v) => setData({ ...data, mountType: v })}>
                      <div className="space-y-3">
                        {availableMounts.map((mt) => (
                          <Label
                            key={mt.id}
                            htmlFor={`mount-${mt.id}`}
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              data.mountType === mt.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <RadioGroupItem value={mt.id} id={`mount-${mt.id}`} className="mt-0.5" />
                            <div>
                              <span className="font-medium text-sm">{mt.name}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{mt.description}</p>
                            </div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Case Type */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Kasa Tipi</Label>
                    <RadioGroup value={data.caseType} onValueChange={(v) => setData({ ...data, caseType: v })}>
                      <div className="space-y-3">
                        {CASE_TYPES.map((ct) => (
                          <Label
                            key={ct.id}
                            htmlFor={`case-${ct.id}`}
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              data.caseType === ct.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                          >
                            <RadioGroupItem value={ct.id} id={`case-${ct.id}`} className="mt-0.5" />
                            <div>
                              <span className="font-medium text-sm">{ct.name}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {ct.description}
                                {ct.surchargePerSqm > 0 && (
                                  <span className="text-primary font-medium"> (+{ct.surchargePerSqm} ₺/m²)</span>
                                )}
                              </p>
                            </div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {/* Step 4: Summary */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800 dark:text-green-300">Ölçüleriniz Hazır!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Pencere Tipi:</span>
                        <p className="font-medium">{selectedWindow?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Montaj Tipi:</span>
                        <p className="font-medium">{MOUNT_TYPES.find((m) => m.id === data.mountType)?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Kasa Tipi:</span>
                        <p className="font-medium">{CASE_TYPES.find((c) => c.id === data.caseType)?.name}</p>
                      </div>
                      {data.windowType === "cam-balkon" ? (
                        <>
                          <div>
                            <span className="text-muted-foreground">Kanat Sayısı:</span>
                            <p className="font-medium">{data.panels.filter((p) => parseFloat(p.width) > 0).length}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Kanat Detayları:</span>
                            <div className="mt-1 space-y-1">
                              {data.panels.filter((p) => parseFloat(p.width) > 0).map((p, i) => (
                                <p key={i} className="text-xs font-medium">
                                  Kanat {i + 1}: {p.width} x {p.height} cm
                                  {p.isOpenable && <span className="text-primary"> (açılır, -2cm)</span>}
                                </p>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-muted-foreground">Genişlik:</span>
                            <p className="font-medium">{data.width} cm</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Yükseklik:</span>
                            <p className="font-medium">{data.height} cm</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Adet:</span>
                            <p className="font-medium">{data.windowCount}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {capturedPhotos.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Çekilen Fotoğraflar ({capturedPhotos.length})</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {capturedPhotos.map((photo, i) => (
                          <img key={i} src={photo} alt={`Ölçü ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border shrink-0" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/fiyat-hesapla?width=${getTotalMeasurements().width}&height=${getTotalMeasurements().height}&mount=${data.mountType}&case=${data.caseType}&count=${getTotalMeasurements().count}&window=${data.windowType}`}>
                      <Button className="btn-premium gap-2 w-full sm:w-auto">
                        Fiyat Hesapla
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/siparis?width=${getTotalMeasurements().width}&height=${getTotalMeasurements().height}&mount=${data.mountType}&case=${data.caseType}&count=${getTotalMeasurements().count}&window=${data.windowType}`}>
                      <Button variant="outline" className="gap-2 rounded-xl w-full sm:w-auto">
                        Sipariş Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation */}
              {step < 4 && (
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Geri
                  </Button>
                  <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-2 btn-premium">
                    İleri
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Voice Guide & Video Helper */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            {/* Tab Toggle for Mobile */}
            <Tabs defaultValue="voice" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="voice" className="flex-1 gap-1.5 text-xs">
                  <Volume2 className="h-3.5 w-3.5" />
                  Sesli Rehber
                </TabsTrigger>
                <TabsTrigger value="video" className="flex-1 gap-1.5 text-xs">
                  <Video className="h-3.5 w-3.5" />
                  Kamera
                </TabsTrigger>
              </TabsList>

              <TabsContent value="voice" className="mt-3">
                {data.windowType ? (
                  <VoiceMeasureGuide windowType={data.windowType} />
                ) : (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <Volume2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Pencere tipini seçtikten sonra sesli rehber aktif olacak
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="video" className="mt-3">
                <VideoMeasureHelper
                  currentStep={step}
                  mountType={data.mountType}
                  onCapture={handleCapture}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
