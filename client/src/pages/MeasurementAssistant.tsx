import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  MessageCircle,
  NotebookPen,
  Phone,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  Smartphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CASE_TYPES } from "@shared/types";
import LiveMeasurementCamera from "@/features/live-measurement/LiveMeasurementCamera";
import {
  APPLICATION_AREAS,
  CAM_BALCONY_CONFIRMATIONS,
  MOUNTING_LABELS,
  MOUNTING_OPTIONS,
  PVC_ALUMINUM_CONFIRMATIONS,
  buildMeasurementText,
  calculatePanel,
  createTransferPayload,
  formatCm,
  hasDuplicateMeasurement,
  validateMountingType,
  type ApplicationArea,
  type CameraGuideMode,
  type MeasurementPanelDraft,
  type MountingType,
} from "@/features/live-measurement/rules";

const WHATSAPP_NUMBER = "905300288903";
const TRANSFER_KEY = "rgnfix:measurement-transfer";
const PIECE_COUNTS = Array.from({ length: 30 }, (_, index) => index + 1);

const steps = [
  { id: 1, title: "Hazırlık" },
  { id: 2, title: "Uygulama" },
  { id: 3, title: "Ölçüm" },
  { id: 4, title: "Onay" },
] as const;

type PreparationMethod = "paper" | "notes" | "second-device" | "screen";

const preparationOptions: Array<{
  id: PreparationMethod;
  title: string;
  description: string;
  icon: typeof FileText;
}> = [
  { id: "paper", title: "Kalem ve kâğıda yazacağım", description: "Her camı sırayla not edin.", icon: NotebookPen },
  { id: "notes", title: "Telefonumun notlarına yazacağım", description: "Notlar uygulamasını kullanın.", icon: Smartphone },
  { id: "second-device", title: "Başka bir telefondan RGNFIX’i açacağım", description: "Bir cihaz kamera, diğeri ölçü girişi için kullanılabilir.", icon: Phone },
  { id: "screen", title: "Ölçüleri bu ekrana yazacağım", description: "Her kanadı doğrudan RGNFIX’e kaydedin.", icon: ClipboardList },
];

function createPanel(index: number, isOpeningPanel = false): MeasurementPanelDraft {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    measuredWidth: "",
    measuredHeight: "",
    heightCheck: "",
    isOpeningPanel,
    duplicateConfirmed: false,
    completed: false,
  };
}

function normalizeMeasurementEntry(value: string) {
  const cleaned = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [whole = "", ...decimalParts] = cleaned.split(",");
  if (decimalParts.length === 0) return whole;
  return `${whole},${decimalParts.join("").slice(0, 1)}`;
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [metadata, encoded] = dataUrl.split(",");
  const mime = metadata.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = atob(encoded || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], filename, { type: mime });
}

export default function MeasurementAssistant() {
  const [, navigate] = useLocation();
  const lastSpokenTextRef = useRef("");
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [preparationMethod, setPreparationMethod] = useState<PreparationMethod | "">("");
  const [applicationArea, setApplicationArea] = useState<ApplicationArea | "">("");
  const [mountType, setMountType] = useState<MountingType | "">("");
  const [caseType, setCaseType] = useState("kalin");
  const [pieceCount, setPieceCount] = useState(1);
  const [panels, setPanels] = useState<MeasurementPanelDraft[]>([createPanel(0)]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraGuideMode>("frame");
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [confirmations, setConfirmations] = useState<Record<number, boolean>>({});
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const selectedArea = APPLICATION_AREAS.find(option => option.id === applicationArea);
  const availableMounts = applicationArea ? MOUNTING_OPTIONS[applicationArea] : [];
  const currentPanel = panels[currentPanelIndex];
  const completedCount = panels.filter(panel => panel.completed).length;
  const openingPanelCount = panels.filter(panel => panel.isOpeningPanel).length;
  const confirmationItems = applicationArea === "cam_balkon"
    ? CAM_BALCONY_CONFIRMATIONS
    : PVC_ALUMINUM_CONFIRMATIONS;
  const allConfirmationsChecked = confirmationItems.every((_, index) => confirmations[index]);

  const calculatedMeasurements = useMemo(() => {
    if (!applicationArea || panels.some(panel => !panel.completed)) return [];
    try {
      return panels.map((panel, index) => calculatePanel(applicationArea, panel, index));
    } catch {
      return [];
    }
  }, [applicationArea, panels]);

  const currentLabel = applicationArea === "cam_balkon"
    ? `${currentPanelIndex + 1}. Kanat${currentPanel?.isOpeningPanel ? " – Açılır kanat" : ""}`
    : `${currentPanelIndex + 1}. Parça`;

  const cameraInstruction = cameraMode === "width"
    ? "Çelik metreyi camın sol iç kenarından sağ iç kenarına düz tutun. Değeri metreden okuyun."
    : cameraMode === "height"
      ? "Çelik metreyi üst iç kenardan alt iç kenara dik tutun. Boyu metreden okuyun."
      : "Camın ölçü alınacak bölümünü görünür hâle getirin. Kamera ölçü hesaplamaz.";

  const liveGuidanceText = useMemo(() => {
    if (!started) return "";
    if (step === 1) {
      return "Hoş geldiniz. Önce ölçüleri nereye kaydedeceğinizi seçin. Yanınızda çelik metre bulundurun. Tam sayı ölçü girebilirsiniz. Küsurat varsa virgülle yazabilirsiniz.";
    }
    if (step === 2) {
      if (!applicationArea) {
        return "Şimdi perdenin uygulanacağı alanı seçin. Cam balkon, PVC veya alüminyum seçeneklerinden uygun olanı işaretleyin.";
      }
      if (applicationArea === "cam_balkon") {
        return "Cam balkonunuzdaki toplam kanat sayısını seçin. İki, üç, dokuz veya başka bir sayı olabilir. Birden fazla açılır kanat bulunabilir. Ölçüm sırasında açılır olan her kanadı ayrı ayrı işaretleyeceğiz.";
      }
      return `${selectedArea?.name ?? "Uygulama alanı"} için montaj ve kasa tipini seçin. Ardından ölçülecek toplam parça sayısını belirleyin.`;
    }
    if (step === 3) {
      const openingReminder = applicationArea === "cam_balkon"
        ? currentPanel?.isOpeningPanel
          ? "Bu kanat açılır olarak işaretlendi. Siz pay düşmeyin; sistem en ölçüsünden iki santimetreyi otomatik düşecek."
          : "Bu kanat açılıyorsa açılır kanat kutusunu işaretleyin. Birden fazla açılır kanat işaretleyebilirsiniz."
        : "";
      const measurementPrompt = cameraMode === "height"
        ? `Şimdi ${currentLabel} için boy ölçüsünü üstten alta alın. Tam sayıysa örneğin yüz yetmiş sekiz yazın. Küsurat varsa yüz yetmiş sekiz virgül üç şeklinde girin. Boyu ikinci kez kontrol edin.`
        : cameraMode === "width"
          ? `Şimdi ${currentLabel} için en ölçüsünü soldan sağa alın. Tam sayıysa doğrudan yazın. Küsurat varsa virgülle girin.`
          : `${currentLabel} ölçümüne başlıyoruz. Camı kadraja alın ve önce en ölçüsünü hazırlayın.`;
      return `${measurementPrompt} ${openingReminder}`.trim();
    }
    return "Bütün ölçüler tamamlandı. Net ölçüleri ve sistemin hesapladığı üretim ölçülerini kontrol edin. Onay kutularını işaretledikten sonra fiyat hesaplamaya geçebilirsiniz.";
  }, [applicationArea, cameraMode, currentLabel, currentPanel?.isOpeningPanel, selectedArea?.name, started, step]);

  const speakText = (text: string, force = false) => {
    if (!text || !("speechSynthesis" in window)) return;
    if (!force && lastSpokenTextRef.current === text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    const turkishVoice = window.speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith("tr"));
    if (turkishVoice) utterance.voice = turkishVoice;
    lastSpokenTextRef.current = text;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!started || !voiceEnabled || !liveGuidanceText) return;
    const timeout = window.setTimeout(() => speakText(liveGuidanceText), 300);
    return () => window.clearTimeout(timeout);
  }, [liveGuidanceText, started, voiceEnabled]);

  useEffect(() => {
    if (!started) return;
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [started, step]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const startAssistant = () => {
    lastSpokenTextRef.current = "";
    setStarted(true);
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
      setVoiceEnabled(false);
      return;
    }
    setVoiceEnabled(true);
    lastSpokenTextRef.current = "";
    window.setTimeout(() => speakText(liveGuidanceText, true), 100);
  };

  const syncPieceCount = (nextCount: number) => {
    const safeCount = Math.min(30, Math.max(1, Math.trunc(nextCount || 1)));
    setPieceCount(safeCount);
    setPanels(current => Array.from(
      { length: safeCount },
      (_, index) => current[index] ?? createPanel(index, applicationArea === "cam_balkon" && index === 0),
    ));
    setCurrentPanelIndex(index => Math.min(index, safeCount - 1));
    setConfirmations({});
    setError("");
  };

  const selectApplicationArea = (value: ApplicationArea) => {
    setApplicationArea(value);
    setMountType("");
    setPieceCount(1);
    setPanels([createPanel(0, value === "cam_balkon")]);
    setCurrentPanelIndex(0);
    setConfirmations({});
    setError("");
  };

  const updateCurrentPanel = (field: "measuredWidth" | "measuredHeight" | "heightCheck", value: string) => {
    const normalizedValue = normalizeMeasurementEntry(value);
    setPanels(current => current.map((panel, index) => index === currentPanelIndex
      ? { ...panel, [field]: normalizedValue, completed: false, duplicateConfirmed: false }
      : panel));
    setError("");
  };

  const setCurrentPanelOpening = (isOpeningPanel: boolean) => {
    setPanels(current => current.map((panel, index) => index === currentPanelIndex
      ? { ...panel, isOpeningPanel, completed: false }
      : panel));
    lastSpokenTextRef.current = "";
    setError("");
  };

  const confirmDuplicate = (confirmed: boolean) => {
    if (confirmed) {
      setPanels(current => current.map((panel, index) => index === currentPanelIndex
        ? { ...panel, duplicateConfirmed: true }
        : panel));
    } else {
      setPanels(current => current.map((panel, index) => index === currentPanelIndex
        ? { ...panel, measuredWidth: "", measuredHeight: "", heightCheck: "", duplicateConfirmed: false, completed: false }
        : panel));
      setCameraMode("width");
    }
  };

  const completeCurrentPanel = () => {
    if (!applicationArea || !currentPanel) return;
    setError("");
    try {
      calculatePanel(applicationArea, currentPanel, currentPanelIndex);
      if (hasDuplicateMeasurement(panels, currentPanelIndex) && !currentPanel.duplicateConfirmed) {
        setError("Camlar aynı görünebilir ama ölçüleri farklı olabilir. Bu camı ayrıca ölçtüğünüzü onaylayın.");
        return;
      }

      const nextPanels = panels.map((panel, index) => index === currentPanelIndex ? { ...panel, completed: true } : panel);
      setPanels(nextPanels);
      const nextIncomplete = nextPanels.findIndex((panel, index) => index > currentPanelIndex && !panel.completed);
      if (nextIncomplete >= 0) {
        setCurrentPanelIndex(nextIncomplete);
        setCameraMode("width");
        lastSpokenTextRef.current = "";
      }
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : "Bu ölçüyü bir kez daha kontrol edelim.";
      setError(message);
      if (voiceEnabled) speakText(message, true);
    }
  };

  const canGoNext = () => {
    if (step === 1) return Boolean(preparationMethod);
    if (step === 2) {
      if (!applicationArea || !mountType || !caseType || pieceCount < 1) return false;
      return validateMountingType(applicationArea, mountType).valid;
    }
    if (step === 3) {
      const allCompleted = panels.length === pieceCount && panels.every(panel => panel.completed);
      const openingPanelsValid = applicationArea !== "cam_balkon" || openingPanelCount > 0;
      return allCompleted && openingPanelsValid;
    }
    return false;
  };

  const goNext = () => {
    if (!canGoNext()) return;
    lastSpokenTextRef.current = "";
    setStep(current => Math.min(4, current + 1));
    setError("");
  };

  const buildText = () => {
    if (!applicationArea || !mountType) return "";
    return buildMeasurementText({ applicationArea, mountType, measurements: calculatedMeasurements });
  };

  const downloadMeasurementList = () => {
    const text = buildText();
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `RGNFIX-olcu-listesi-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const sendMeasurementsToWhatsApp = () => {
    const text = buildText();
    if (!text) return;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const shareMeasurementPhoto = async () => {
    if (capturedPhotos.length === 0) {
      setError("Önce kamera bölümünden ölçü fotoğrafı çekin.");
      return;
    }

    const file = dataUrlToFile(capturedPhotos[0], `RGNFIX-olcu-fotografi-${Date.now()}.jpg`);
    const shareData: ShareData = {
      title: "RGNFIX Ölçü Fotoğrafı",
      text: "RGNFIX Ölçü Asistanı üzerinden çektiğim ölçü fotoğrafını gönderiyorum.",
      files: [file],
    };
    const shareNavigator = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

    if (navigator.share && (!shareNavigator.canShare || shareNavigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }

    const anchor = document.createElement("a");
    anchor.href = capturedPhotos[0];
    anchor.download = file.name;
    anchor.click();
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("RGNFIX ölçü fotoğrafımı kontrol etmenizi rica ediyorum. Fotoğrafı biraz önce cihazıma indirdim ve bu sohbete ekleyeceğim.")}`, "_blank", "noopener,noreferrer");
  };

  const transferToPriceCalculator = () => {
    if (!applicationArea || !mountType || !allConfirmationsChecked || calculatedMeasurements.length === 0) return;
    const payload = createTransferPayload({
      applicationArea,
      mountType,
      caseType,
      measurements: calculatedMeasurements,
    });
    sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(payload));
    const first = calculatedMeasurements[0];
    const query = new URLSearchParams({
      from: "olcu-asistani",
      mount: mountType,
      case: caseType,
      window: applicationArea,
      width: formatCm(first.productionWidthCm),
      height: formatCm(first.productionHeightCm),
      count: "1",
    });
    navigate(`/fiyat-hesapla?${query.toString()}`);
  };

  const resetAll = () => {
    window.speechSynthesis?.cancel();
    lastSpokenTextRef.current = "";
    setStarted(false);
    setStep(1);
    setPreparationMethod("");
    setApplicationArea("");
    setMountType("");
    setCaseType("kalin");
    setPieceCount(1);
    setPanels([createPanel(0)]);
    setCurrentPanelIndex(0);
    setCameraMode("frame");
    setCapturedPhotos([]);
    setConfirmations({});
    setError("");
    sessionStorage.removeItem(TRANSFER_KEY);
  };

  if (!started) {
    return (
      <div className="container max-w-4xl py-10 sm:py-16">
        <Card className="overflow-hidden border-border/60 shadow-lg">
          <div className="grid lg:grid-cols-2">
            <div className="flex min-h-[360px] flex-col justify-center bg-primary px-7 py-10 text-primary-foreground sm:px-10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Ruler className="h-7 w-7" /></div>
              <p className="text-sm font-semibold text-white/75">RGNFIX CANLI ÖLÇÜ ASİSTANI</p>
              <h1 className="mt-3 text-3xl font-serif font-bold sm:text-4xl">Ölçüyü birlikte alalım 😊</h1>
              <p className="mt-4 max-w-md leading-7 text-white/80">Sistem adımları canlı olarak seslendirecek. Yanınıza çelik metre alın; tam sayı veya virgüllü ölçü girebilirsiniz.</p>
            </div>
            <CardContent className="flex flex-col justify-center p-7 sm:p-10">
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <strong>Önemli:</strong> Kamera ölçü tahmini yapmaz. Santimetre değerini çelik metreden siz okuyup yazarsınız. Sistem hiçbir ölçüyü sessizce değiştirmez.
              </div>
              <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                <p>✓ 56 gibi tam sayı ölçüler kabul edilir.</p>
                <p>✓ Küsurat varsa 56,4 şeklinde virgülle girilir.</p>
                <p>✓ Birden fazla açılır kanat işaretlenebilir.</p>
                <p>✓ Her cam ayrı ayrı ölçülür.</p>
              </div>
              <Button onClick={startAssistant} className="mt-7 h-12 gap-2 text-base">
                Canlı Ölçüye Başla <Volume2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-7 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"><Ruler className="h-4 w-4" /> Canlı Sesli Ölçü Yönlendirmesi</div>
        <h1 className="text-3xl font-serif font-bold sm:text-4xl">Akıllı Ölçü Asistanı</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">Sistem sizinle konuşarak adım adım ölçü aldırır. Tam sayı ölçü girebilir, küsurat varsa virgül kullanabilirsiniz.</p>
        <Button type="button" variant="outline" size="sm" onClick={toggleVoice} className="mt-4 gap-2">
          {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {voiceEnabled ? "Canlı Ses Açık" : "Canlı Sesi Aç"}
        </Button>
      </div>

      <div className="mb-8 flex items-center justify-center gap-1 sm:gap-3">
        {steps.map((wizardStep, index) => (
          <div key={wizardStep.id} className="flex items-center gap-1 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${step > wizardStep.id ? "bg-primary text-primary-foreground" : step === wizardStep.id ? "border-2 border-primary bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {step > wizardStep.id ? <Check className="h-4 w-4" /> : wizardStep.id}
              </div>
              <span className="hidden text-[11px] font-medium sm:block">{wizardStep.title}</span>
            </div>
            {index < steps.length - 1 && <div className={`mb-4 h-0.5 w-7 sm:w-16 ${step > wizardStep.id ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="mx-auto max-w-4xl border-border/60">
          <CardHeader>
            <CardTitle>Ölçüleri nereye kaydedeceksiniz?</CardTitle>
            <p className="text-sm text-muted-foreground">Her camı <strong>EN × BOY</strong> şeklinde ayrı ayrı kaydedin.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={preparationMethod} onValueChange={value => setPreparationMethod(value as PreparationMethod)}>
              <div className="grid gap-3 sm:grid-cols-2">
                {preparationOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <Label key={option.id} htmlFor={`prep-${option.id}`} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${preparationMethod === option.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                      <RadioGroupItem id={`prep-${option.id}`} value={option.id} className="mt-1" />
                      <Icon className="mt-0.5 h-5 w-5 text-primary" />
                      <span><strong className="block text-sm">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span></span>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>

            {preparationMethod === "second-device" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Ölçüm yaptığınız telefonun kamerasını kullanırken, RGNFIX’i başka bir telefondan açıp ölçüleri <strong>EN × BOY</strong> şeklinde yazabilirsiniz.</div>
            )}
            {(preparationMethod === "paper" || preparationMethod === "notes") && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Ölçüleriniz tamamlandığında not aldığınız kâğıdın veya telefon ekranının fotoğrafını WhatsApp üzerinden bize gönderebilirsiniz.</div>
            )}

            <div className="rounded-2xl bg-muted/60 p-4 font-mono text-sm leading-7">
              <p>1. Cam: 56 × 178 cm</p>
              <p>2. Cam: 57,1 × 178,2 cm</p>
              <p>3. Cam: 56,8 × 178 cm</p>
            </div>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Doğru ölçü için çelik metre kullanın.</strong> Kumaş mezura, cetvel, ip veya kamera ölçümü kullanmayın.</div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="border-border/60 lg:col-span-3">
            <CardHeader><CardTitle>Uygulama Alanı</CardTitle><p className="text-sm text-muted-foreground">Perdenin uygulanacağı pencere veya kapı sistemini seçin.</p></CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={applicationArea} onValueChange={value => selectApplicationArea(value as ApplicationArea)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {APPLICATION_AREAS.map(option => (
                    <Label key={option.id} htmlFor={option.id} className={`cursor-pointer rounded-xl border p-4 transition ${applicationArea === option.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                      <div className="flex items-start gap-3"><RadioGroupItem id={option.id} value={option.id} className="mt-1" /><span><strong className="block text-sm">{option.name}</strong><span className="mt-1 block text-xs text-muted-foreground">{option.description}</span></span></div>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              {applicationArea && (
                <>
                  {applicationArea !== "cam_balkon" && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Bu uygulama alanında kancalı montaj kullanılmaz. Vidalı veya yapıştırmalı montajla devam edebilirsiniz.</div>}
                  <div>
                    <Label className="mb-3 block font-semibold">Montaj Tipi</Label>
                    <RadioGroup value={mountType} onValueChange={value => setMountType(value as MountingType)}>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {availableMounts.map(option => (
                          <Label key={option} htmlFor={`mount-${option}`} className={`cursor-pointer rounded-xl border p-4 text-sm transition ${mountType === option ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                            <div className="flex items-center gap-2"><RadioGroupItem id={`mount-${option}`} value={option} /> <strong>{MOUNTING_LABELS[option]}</strong></div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-3 block font-semibold">Kasa Tipi</Label>
                    <RadioGroup value={caseType} onValueChange={setCaseType}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {CASE_TYPES.map(option => (
                          <Label key={option.id} htmlFor={`case-${option.id}`} className={`cursor-pointer rounded-xl border p-4 text-sm transition ${caseType === option.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                            <div className="flex items-start gap-2"><RadioGroupItem id={`case-${option.id}`} value={option.id} className="mt-1" /><span><strong className="block">{option.name}</strong><span className="mt-1 block text-xs text-muted-foreground">{option.description}</span></span></div>
                          </Label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 lg:col-span-2">
            <CardHeader><CardTitle>{applicationArea === "cam_balkon" ? "Cam Balkon Kanatları" : "Parça Sayısı"}</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {applicationArea === "cam_balkon" && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-primary/5 p-4 text-sm leading-6"><strong>Bir cam balkonda birden fazla açılır kanat olabilir.</strong><br />Ölçüm ekranında açılır olan her kanadı ayrı ayrı işaretleyeceksiniz. Siz ölçüden pay düşmeyeceksiniz.</div>
                  <p className="text-sm text-muted-foreground">Camların hepsi aynı görünebilir ama ölçüleri birbirinden farklı olabilir. Bu yüzden her camı tek tek ölçeceğiz.</p>
                </div>
              )}
              {applicationArea && (
                <div className="space-y-2">
                  <Label htmlFor="piece-count">{applicationArea === "cam_balkon" ? "Cam balkonunuzda kaç tane kanat var?" : "Kaç ayrı cam/parça ölçülecek?"}</Label>
                  <select
                    id="piece-count"
                    value={pieceCount}
                    onChange={event => syncPieceCount(Number(event.target.value))}
                    className="h-12 w-full rounded-xl border border-input bg-background px-3 text-lg outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PIECE_COUNTS.map(count => <option key={count} value={count}>{count}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground">1’den 30’a kadar bütün sayılar seçilebilir. Örneğin 2, 3, 7 veya 9 kanat girebilirsiniz.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && applicationArea && currentPanel && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card className="border-border/60">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-primary">{completedCount}/{pieceCount} {selectedArea?.pieceLabel.toLocaleLowerCase("tr-TR")} tamamlandı</p><CardTitle className="mt-1">{currentLabel}</CardTitle></div>
                  <Button variant="outline" size="sm" onClick={() => speakText(liveGuidanceText, true)} className="gap-2"><Volume2 className="h-4 w-4" /> Tekrar Söyle</Button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${(completedCount / pieceCount) * 100}%` }} /></div>
              </CardHeader>
              <CardContent className="space-y-5">
                {applicationArea === "cam_balkon" && (
                  <Label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition ${currentPanel.isOpeningPanel ? "border-primary bg-primary/5" : ""}`}>
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={currentPanel.isOpeningPanel} onChange={event => setCurrentPanelOpening(event.target.checked)} />
                    <span><strong>Bu kanat açılır kanat</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Açılır kanat sayısı birden fazla olabilir. Açılır olanların tamamını işaretleyin. Sistem her açılır kanadın eninden 2 cm payı otomatik düşürür.</span></span>
                  </Label>
                )}

                {applicationArea === "cam_balkon" && currentPanel.isOpeningPanel && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">Bu açılır kanatta siz sadece çelik metrede gördüğünüz net ölçüyü yazın. Sistem en ölçüsünden 2 cm payı otomatik uygulayacak.</div>
                )}
                {applicationArea === "cam_balkon" && !currentPanel.isOpeningPanel && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">Bu normal kanatta hiçbir pay düşülmez. Metrede gördüğünüz EN ve BOY ölçüsünü aynen yazın.</div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="measured-width"><strong>EN:</strong> Soldan sağa (cm)</Label>
                    <Input id="measured-width" inputMode="decimal" placeholder="Örn: 56 veya 56,4" value={currentPanel.measuredWidth} onFocus={() => setCameraMode("width")} onChange={event => updateCurrentPanel("measuredWidth", event.target.value)} className="h-12 text-lg" />
                    <p className="text-xs text-muted-foreground">Tam sayı girebilirsiniz. Küsurat varsa virgül kullanın.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="measured-height"><strong>BOY:</strong> Yukarıdan aşağıya (cm)</Label>
                    <Input id="measured-height" inputMode="decimal" placeholder="Örn: 178 veya 178,3" value={currentPanel.measuredHeight} onFocus={() => setCameraMode("height")} onChange={event => updateCurrentPanel("measuredHeight", event.target.value)} className="h-12 text-lg" />
                    <p className="text-xs text-muted-foreground">Tam sayı girebilirsiniz. Küsurat varsa virgül kullanın.</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-2xl border bg-muted/30 p-4">
                  <Label htmlFor="height-check">Boy ölçüsünü ikinci kez kontrol edin</Label>
                  <Input id="height-check" inputMode="decimal" placeholder="Boyu yeniden ölçüp yazın" value={currentPanel.heightCheck} onFocus={() => setCameraMode("height")} onChange={event => updateCurrentPanel("heightCheck", event.target.value)} className="h-11" />
                  <p className="text-xs leading-5 text-muted-foreground">İki ölçüm farklıysa sistem ortalama almaz. Çelik metreyi düz tutup yeniden ölçmenizi ister.</p>
                </div>

                {hasDuplicateMeasurement(panels, currentPanelIndex) && !currentPanel.duplicateConfirmed && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                    <p className="font-semibold">Camlar aynı görünebilir ama ölçüleri farklı olabilir. Bu camı ayrıca ölçtüğünüzden emin misiniz?</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button size="sm" onClick={() => confirmDuplicate(true)}>Evet, bu camı ayrıca ölçtüm</Button>
                      <Button size="sm" variant="outline" onClick={() => confirmDuplicate(false)}>Hayır, yeniden ölçeceğim</Button>
                    </div>
                  </div>
                )}

                {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">{error}</div>}

                <Button onClick={completeCurrentPanel} className="h-12 w-full gap-2"><CheckCircle2 className="h-5 w-5" /> {currentPanel.completed ? "Ölçüyü Yeniden Onayla" : `${currentLabel} Ölçüsünü Tamamla`}</Button>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader><CardTitle className="text-lg">Ölçülen Parçalar</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {panels.map((panel, index) => (
                    <button key={panel.id} type="button" onClick={() => { setCurrentPanelIndex(index); setCameraMode("width"); setError(""); lastSpokenTextRef.current = ""; }} className={`rounded-xl border p-4 text-left transition ${currentPanelIndex === index ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}>
                      <div className="flex items-center justify-between gap-2"><strong className="text-sm">{applicationArea === "cam_balkon" ? `${index + 1}. Kanat${panel.isOpeningPanel ? " – Açılır" : ""}` : `${index + 1}. Parça`}</strong>{panel.completed && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}</div>
                      <p className="mt-2 text-xs text-muted-foreground">{panel.measuredWidth || "—"} × {panel.measuredHeight || "—"} cm</p>
                    </button>
                  ))}
                </div>
                {applicationArea === "cam_balkon" && openingPanelCount === 0 && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Devam etmek için açılır olan en az bir kanadı işaretleyin. Birden fazla açılır kanat varsa hepsini işaretleyebilirsiniz.</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <LiveMeasurementCamera mode={cameraMode} instruction={cameraInstruction} onCapture={image => setCapturedPhotos(current => [...current, image])} />
              <div className="rounded-xl border bg-card p-4 text-sm leading-6"><strong>Canlı sesli rehber açık.</strong><br />Sistem her kanatta sıradaki işlemi otomatik olarak söyleyecek. Duymadıysanız “Tekrar Söyle” düğmesine basın.</div>
              {capturedPhotos.length > 0 && (
                <div className="rounded-xl border bg-card p-4"><p className="text-sm font-semibold">Ölçü fotoğrafları ({capturedPhotos.length})</p><div className="mt-3 flex gap-2 overflow-x-auto">{capturedPhotos.map((photo, index) => <img key={`${photo.slice(-20)}-${index}`} src={photo} alt={`Ölçü fotoğrafı ${index + 1}`} className="h-16 w-16 shrink-0 rounded-lg border object-cover" />)}</div></div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 4 && applicationArea && mountType && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="border-border/60 lg:col-span-3">
            <CardHeader><CardTitle>Ölçü Listesi</CardTitle><p className="text-sm text-muted-foreground">Net ölçünüz ve matematiksel olarak hesaplanan üretim ölçüsü birlikte gösterilir.</p></CardHeader>
            <CardContent className="space-y-4">
              {calculatedMeasurements.map(measurement => (
                <div key={measurement.index} className="rounded-2xl border p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><strong>{measurement.label}</strong>{measurement.panelType === "opening_panel" && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Sistem payı: -2 cm EN</span>}</div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-muted/50 p-3"><span className="text-xs text-muted-foreground">Müşterinin net ölçüsü</span><p className="mt-1 text-lg font-semibold">{formatCm(measurement.measuredWidthCm)} × {formatCm(measurement.measuredHeightCm)} cm</p></div>
                    <div className="rounded-xl bg-primary/5 p-3"><span className="text-xs text-muted-foreground">Üretim / fiyat aktarım ölçüsü</span><p className="mt-1 text-lg font-semibold text-primary">{formatCm(measurement.productionWidthCm)} × {formatCm(measurement.productionHeightCm)} cm</p></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Son Onay</CardTitle><p className="text-sm text-muted-foreground">Bütün kutular işaretlenmeden fiyat hesaplamaya geçilemez.</p></CardHeader>
            <CardContent className="space-y-3">
              {confirmationItems.map((item, index) => (
                <Label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-5">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={Boolean(confirmations[index])} onChange={event => setConfirmations(current => ({ ...current, [index]: event.target.checked }))} />
                  <span>{item}</span>
                </Label>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 lg:col-span-5">
            <CardContent className="p-5">
              {error && <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Button onClick={transferToPriceCalculator} disabled={!allConfirmationsChecked} className="gap-2 lg:col-span-2"><ArrowRight className="h-4 w-4" /> Ölçüleri Fiyat Hesaplamaya Aktar</Button>
                <Button variant="outline" onClick={downloadMeasurementList} className="gap-2"><Download className="h-4 w-4" /> Ölçü Listesini İndir</Button>
                <Button variant="outline" onClick={sendMeasurementsToWhatsApp} className="gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp’tan Gönder</Button>
                <Button variant="outline" onClick={() => void shareMeasurementPhoto()} className="gap-2"><Camera className="h-4 w-4" /> Fotoğrafı Gönder</Button>
              </div>
              <Button variant="ghost" onClick={resetAll} className="mt-4 w-full gap-2 text-muted-foreground"><RefreshCcw className="h-4 w-4" /> Yeniden Ölç</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <Button variant="ghost" onClick={() => {
          lastSpokenTextRef.current = "";
          if (step === 1) setStarted(false);
          else setStep(current => Math.max(1, current - 1));
        }} className="gap-2"><ArrowLeft className="h-4 w-4" /> Geri</Button>
        {step < 4 && <Button onClick={goNext} disabled={!canGoNext()} className="gap-2">Devam Et <ArrowRight className="h-4 w-4" /></Button>}
      </div>
    </div>
  );
}
