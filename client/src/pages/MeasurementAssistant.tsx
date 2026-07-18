import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageCircle, RefreshCcw, Ruler, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CASE_TYPES } from "@shared/types";
import LiveMeasurementCamera from "@/features/live-measurement/LiveMeasurementCamera";
import { RealtimeVoiceGuide, type VoiceState } from "@/lib/realtimeVoice";
import {
  APPLICATION_AREAS,
  MOUNTING_LABELS,
  MOUNTING_OPTIONS,
  buildMeasurementText,
  calculatePanel,
  createTransferPayload,
  formatCm,
  normalizeCmInput,
  validateMountingType,
  type ApplicationArea,
  type MeasurementPanelDraft,
  type MountingType,
} from "@/features/live-measurement/rules";

const WHATSAPP_NUMBER = "905300288903";
const TRANSFER_KEY = "rgnfix:measurement-transfer";
const RECORDING_KEY = "rgnfix:measurement-recording";
const PIECE_COUNTS = Array.from({ length: 30 }, (_, index) => index + 1);

type Screen = "intro" | "setup" | "measure" | "done";
type MeasurementPhase = "width" | "height";

function createPanel(index: number): MeasurementPanelDraft {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    measuredWidth: "",
    measuredHeight: "",
    isOpeningPanel: false,
    completed: false,
  };
}

function normalizeMeasurementEntry(value: string) {
  const cleaned = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [whole = "", ...decimalParts] = cleaned.split(",");
  if (decimalParts.length === 0) return whole;
  return `${whole},${decimalParts.join("").slice(0, 2)}`;
}

export default function MeasurementAssistant() {
  const [, navigate] = useLocation();
  const voiceRef = useRef<RealtimeVoiceGuide | null>(null);
  const lastSpokenRef = useRef("");
  const [screen, setScreen] = useState<Screen>("intro");
  const [phase, setPhase] = useState<MeasurementPhase>("width");
  const [applicationArea, setApplicationArea] = useState<ApplicationArea | "">("");
  const [mountType, setMountType] = useState<MountingType | "">("");
  const [caseType, setCaseType] = useState("");
  const [pieceCount, setPieceCount] = useState(1);
  const [panels, setPanels] = useState<MeasurementPanelDraft[]>([createPanel(0)]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [error, setError] = useState("");

  const availableMounts = applicationArea ? MOUNTING_OPTIONS[applicationArea] : [];
  const currentPanel = panels[currentPanelIndex];
  const completedCount = panels.filter(panel => panel.completed).length;

  const calculatedMeasurements = useMemo(() => {
    if (!applicationArea || panels.some(panel => !panel.completed)) return [];
    try {
      return panels.map((panel, index) => calculatePanel(applicationArea, panel, index));
    } catch {
      return [];
    }
  }, [applicationArea, panels]);

  useEffect(() => {
    const guide = new RealtimeVoiceGuide(setVoiceState);
    voiceRef.current = guide;
    return () => guide.disconnect();
  }, []);

  useEffect(() => {
    voiceRef.current?.setMuted(voiceMuted);
  }, [voiceMuted]);

  const currentLabel = applicationArea === "cam_balkon"
    ? `${currentPanelIndex + 1}. kanat`
    : `${currentPanelIndex + 1}. parça`;

  const liveInstruction = useMemo(() => {
    if (screen === "setup") {
      if (!applicationArea) return "Önce uygulama alanını seçin.";
      if (!mountType) return "Şimdi montaj tipini seçin.";
      if (!caseType) return "Tek camsa kalın kasa, çift camsa slim kasa seçin.";
      return "Son olarak toplam cam sayısını seçip ölçüye geçin.";
    }
    if (screen === "measure") {
      if (phase === "width") {
        return applicationArea === "cam_balkon"
          ? `${currentLabel}: Camın net enini ölçün. Açılır kanatsa kutuyu işaretleyin.`
          : `${currentLabel}: Camın net enini ölçüp santimetre olarak yazın.`;
      }
      return `${currentLabel}: Şimdi camın net boyunu ölçüp yazın.`;
    }
    if (screen === "done") return "Ölçüler tamamlandı. Fiyat hesaplamaya geçebilirsiniz.";
    return "";
  }, [applicationArea, caseType, currentLabel, mountType, phase, screen]);

  useEffect(() => {
    if (!liveInstruction || voiceMuted || screen === "intro") return;
    if (lastSpokenRef.current === liveInstruction) return;
    lastSpokenRef.current = liveInstruction;
    const timer = window.setTimeout(() => {
      void voiceRef.current?.speak(liveInstruction).catch(() => setVoiceState("error"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [liveInstruction, screen, voiceMuted]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [screen, currentPanelIndex, phase]);

  const startAssistant = async () => {
    setScreen("setup");
    lastSpokenRef.current = "";
    try {
      await voiceRef.current?.connect();
    } catch {
      setVoiceState("error");
    }
  };

  const syncPieceCount = (nextCount: number) => {
    const safeCount = Math.min(30, Math.max(1, Math.trunc(nextCount || 1)));
    setPieceCount(safeCount);
    setPanels(current => Array.from({ length: safeCount }, (_, index) => current[index] ?? createPanel(index)));
    setCurrentPanelIndex(index => Math.min(index, safeCount - 1));
    setError("");
  };

  const selectArea = (value: ApplicationArea) => {
    setApplicationArea(value);
    setMountType("");
    setCaseType("");
    setPanels(Array.from({ length: pieceCount }, (_, index) => createPanel(index)));
    setCurrentPanelIndex(0);
    setPhase("width");
    setError("");
  };

  const updateCurrentPanel = (field: "measuredWidth" | "measuredHeight", value: string) => {
    const normalized = normalizeMeasurementEntry(value);
    setPanels(current => current.map((panel, index) => index === currentPanelIndex
      ? { ...panel, [field]: normalized, completed: false }
      : panel));
    setError("");
  };

  const setOpeningPanel = (isOpeningPanel: boolean) => {
    setPanels(current => current.map((panel, index) => index === currentPanelIndex
      ? { ...panel, isOpeningPanel, completed: false }
      : panel));
    setError("");
  };

  const beginMeasurement = () => {
    if (!applicationArea || !mountType || !caseType || !validateMountingType(applicationArea, mountType).valid) {
      setError("Uygulama alanı, montaj tipi ve cam tipini seçin.");
      return;
    }
    setCurrentPanelIndex(0);
    setPhase("width");
    setScreen("measure");
    lastSpokenRef.current = "";
    setError("");
  };

  const saveWidth = () => {
    if (!currentPanel) return;
    try {
      normalizeCmInput(currentPanel.measuredWidth);
      setPhase("height");
      lastSpokenRef.current = "";
      setError("");
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "En ölçüsünü kontrol edin.");
    }
  };

  const saveHeight = () => {
    if (!applicationArea || !currentPanel) return;
    try {
      normalizeCmInput(currentPanel.measuredHeight);
      calculatePanel(applicationArea, currentPanel, currentPanelIndex);
      const nextPanels = panels.map((panel, index) => index === currentPanelIndex ? { ...panel, completed: true } : panel);
      setPanels(nextPanels);
      const nextIndex = nextPanels.findIndex((panel, index) => index > currentPanelIndex && !panel.completed);
      if (nextIndex >= 0) {
        setCurrentPanelIndex(nextIndex);
        setPhase("width");
        lastSpokenRef.current = "";
      } else {
        setScreen("done");
        lastSpokenRef.current = "";
      }
      setError("");
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Boy ölçüsünü kontrol edin.");
    }
  };

  const transferToPriceCalculator = () => {
    if (!applicationArea || !mountType || calculatedMeasurements.length === 0) return;
    const payload = createTransferPayload({ applicationArea, mountType, caseType, measurements: calculatedMeasurements, recordingUrl: recordingUrl || undefined });
    sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(payload));
    if (recordingUrl) sessionStorage.setItem(RECORDING_KEY, recordingUrl);
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

  const sendToWhatsApp = () => {
    if (!applicationArea || !mountType || calculatedMeasurements.length === 0) return;
    const text = buildMeasurementText({ applicationArea, mountType, measurements: calculatedMeasurements });
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const resetAll = () => {
    voiceRef.current?.cancel();
    lastSpokenRef.current = "";
    setScreen("intro");
    setPhase("width");
    setApplicationArea("");
    setMountType("");
    setCaseType("");
    setPieceCount(1);
    setPanels([createPanel(0)]);
    setCurrentPanelIndex(0);
    setRecordingUrl("");
    setError("");
    sessionStorage.removeItem(TRANSFER_KEY);
    sessionStorage.removeItem(RECORDING_KEY);
  };

  const voiceButton = (
    <Button type="button" variant="outline" size="sm" onClick={() => setVoiceMuted(value => !value)} className="gap-2">
      {voiceMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      {voiceMuted ? "Sesi Aç" : "Sessize Al"}
    </Button>
  );

  if (screen === "intro") {
    return (
      <div className="container max-w-xl py-12 sm:py-20">
        <Card className="border-border/60 shadow-lg">
          <CardContent className="p-7 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Ruler className="h-7 w-7" /></div>
            <h1 className="mt-5 text-3xl font-serif font-bold">Canlı Ölçü Asistanı</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Sizi adım adım yönlendireceğiz. Çelik metrenizi hazırlayın.</p>
            <Button onClick={() => void startAssistant()} className="mt-7 h-12 w-full gap-2 text-base">Ölçüye Başla <ArrowRight className="h-4 w-4" /></Button>
            <p className="mt-3 text-[11px] text-muted-foreground">Ses yapay zekâ tarafından oluşturulur.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <div className="container max-w-2xl py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><p className="text-sm font-medium text-primary">1. Adım</p><h1 className="text-2xl font-bold">Kısa Bilgiler</h1></div>
          {voiceButton}
        </div>

        <Card>
          <CardContent className="space-y-5 p-5 sm:p-7">
            <div className="space-y-2">
              <Label>1. Uygulama alanı</Label>
              <select value={applicationArea} onChange={event => selectArea(event.target.value as ApplicationArea)} className="h-12 w-full rounded-xl border border-input bg-background px-3">
                <option value="">Seçin</option>
                {APPLICATION_AREAS.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
            </div>

            {applicationArea && (
              <div className="space-y-2">
                <Label>2. Montaj seçeneği</Label>
                <select value={mountType} onChange={event => { setMountType(event.target.value as MountingType); setCaseType(""); }} className="h-12 w-full rounded-xl border border-input bg-background px-3">
                  <option value="">Seçin</option>
                  {availableMounts.map(option => <option key={option} value={option}>{MOUNTING_LABELS[option]}</option>)}
                </select>
              </div>
            )}

            {applicationArea && mountType && (
              <div className="space-y-2">
                <Label>3. Cam / kasa tipi</Label>
                <select value={caseType} onChange={event => setCaseType(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background px-3">
                  <option value="">Seçin</option>
                  {CASE_TYPES.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.id === "kalin" ? "Tek Cam – Kalın Kasa" : "Çift Cam – Slim Kasa"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {applicationArea && mountType && caseType && (
              <div className="space-y-2">
                <Label>4. {applicationArea === "cam_balkon" ? "Toplam kanat sayısı" : "Toplam cam / parça sayısı"}</Label>
                <select value={pieceCount} onChange={event => syncPieceCount(Number(event.target.value))} className="h-12 w-full rounded-xl border border-input bg-background px-3">
                  {PIECE_COUNTS.map(count => <option key={count} value={count}>{count}</option>)}
                </select>
              </div>
            )}

            {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <Button onClick={beginMeasurement} disabled={!applicationArea || !mountType || !caseType} className="h-12 w-full gap-2">Ölçüye Geç <ArrowRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
        {voiceState === "error" && <p className="mt-3 text-center text-xs text-amber-700">Canlı ses açılamadı. Yazılı yönlendirmeyle devam edebilirsiniz.</p>}
      </div>
    );
  }

  if (screen === "measure" && currentPanel) {
    const value = phase === "width" ? currentPanel.measuredWidth : currentPanel.measuredHeight;
    return (
      <div className="container max-w-5xl py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><p className="text-sm font-medium text-primary">{completedCount}/{pieceCount} tamamlandı</p><h1 className="text-2xl font-bold">{currentLabel}</h1></div>
          {voiceButton}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-5 p-5 sm:p-7">
              {applicationArea === "cam_balkon" && (
                <Label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm">
                  <input type="checkbox" checked={currentPanel.isOpeningPanel} onChange={event => setOpeningPanel(event.target.checked)} className="h-4 w-4" />
                  <span><strong>Açılır kanat</strong><span className="block text-xs text-muted-foreground">Yalnızca bu kanat açılıyorsa işaretleyin.</span></span>
                </Label>
              )}
              <div className="rounded-2xl bg-primary/5 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{phase === "width" ? "Önce EN" : "Şimdi BOY"}</p>
                <p className="mt-2 text-sm leading-6">{phase === "width" ? "Camın sol iç kenarından sağ iç kenarına ölçün." : "Camın üst iç kenarından alt iç kenarına ölçün."}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurement-value">{phase === "width" ? "EN ölçüsü (cm)" : "BOY ölçüsü (cm)"}</Label>
                <Input id="measurement-value" inputMode="decimal" autoFocus placeholder={phase === "width" ? "Örn: 51" : "Örn: 178"} value={value} onChange={event => updateCurrentPanel(phase === "width" ? "measuredWidth" : "measuredHeight", event.target.value)} className="h-16 text-center text-2xl font-semibold" />
                <p className="text-center text-xs text-muted-foreground">Net cam ölçüsünü değiştirmeden yazın.</p>
              </div>
              {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              {phase === "width" ? (
                <Button onClick={saveWidth} className="h-12 w-full gap-2">Eni Kaydet, Boya Geç <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={saveHeight} className="h-12 w-full gap-2"><CheckCircle2 className="h-4 w-4" /> Ölçüyü Kaydet</Button>
              )}
              <Button variant="ghost" onClick={() => {
                if (phase === "height") setPhase("width");
                else if (currentPanelIndex > 0) { setCurrentPanelIndex(index => index - 1); setPhase("width"); }
                else setScreen("setup");
                lastSpokenRef.current = "";
              }} className="w-full gap-2"><ArrowLeft className="h-4 w-4" /> Geri</Button>
            </CardContent>
          </Card>
          <LiveMeasurementCamera
            mode={phase}
            instruction={phase === "width" ? "Çelik metreyi camdan cama yatay ve düz tutun." : "Çelik metreyi camdan cama dik ve gergin tutun."}
            onRecordingSaved={recording => { setRecordingUrl(recording.url); sessionStorage.setItem(RECORDING_KEY, recording.url); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div><p className="text-sm font-medium text-primary">Tamamlandı</p><h1 className="text-2xl font-bold">Ölçüler Hazır</h1></div>
        {voiceButton}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Ölçüler</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {calculatedMeasurements.map(measurement => (
            <div key={measurement.index} className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <p className="font-medium">{measurement.label}</p>
              <p className="text-lg font-semibold">{formatCm(measurement.measuredWidthCm)} × {formatCm(measurement.measuredHeightCm)} cm</p>
            </div>
          ))}
          {recordingUrl && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Ölçüm kaydı siparişe eklenmeye hazır.</div>}
        </CardContent>
      </Card>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button onClick={transferToPriceCalculator} className="h-12 gap-2">Fiyat Hesaplamaya Geç <ArrowRight className="h-4 w-4" /></Button>
        <Button variant="outline" onClick={sendToWhatsApp} className="h-12 gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp’tan Gönder</Button>
      </div>
      <Button variant="ghost" onClick={resetAll} className="mt-3 w-full gap-2 text-muted-foreground"><RefreshCcw className="h-4 w-4" /> Baştan Başla</Button>
    </div>
  );
}
