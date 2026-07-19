import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { MEASUREMENT_INSTRUCTIONS } from "@shared/types";

interface VoiceMeasureGuideProps {
  windowType: string;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
}

const windowTypeLabels: Record<string, string> = {
  "cam-balkon": "Cam Balkon",
  standart: "Standart Pencere/Kapı",
  aluminyum: "Alüminyum Pencere/Kapı",
  "surgulu-kapi": "Sürgülü Pencere/Kapı",
};

export default function VoiceMeasureGuide({ windowType, onStepChange, onComplete }: VoiceMeasureGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const instruction = MEASUREMENT_INSTRUCTIONS.find((i) => i.windowType === windowType);
  const steps = instruction?.steps || [];
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!window.speechSynthesis) {
      setSpeechSupported(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis || isMuted) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = 0.85; // Profesyonel, sakin ve anlaşılır hız
    utterance.pitch = 0.95; // Hafif pes, güven veren ton
    utterance.volume = 1.0;

    // Türkçe ses bul - profesyonel erkek/kadın sesi tercih et
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find((v) => v.lang.startsWith("tr") && v.name.toLowerCase().includes("google"))
      || voices.find((v) => v.lang.startsWith("tr"))
      || voices.find((v) => v.lang.startsWith("tr-TR"));
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    stopSpeaking();
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  }, [stopSpeaking, onStepChange]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      goToStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  }, [currentStep, steps.length, goToStep, onComplete]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  }, [currentStep, goToStep]);

  const playCurrentStep = useCallback(() => {
    if (currentStepData) {
      speak(currentStepData.voiceText);
    }
  }, [currentStepData, speak]);

  const toggleMute = useCallback(() => {
    if (isSpeaking) stopSpeaking();
    setIsMuted((prev) => !prev);
  }, [isSpeaking, stopSpeaking]);

  // Voices yüklendiğinde güncelle
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  if (!instruction) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Bu pencere tipi için sesli rehber henüz mevcut değil.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Volume2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Sesli Ölçü Rehberi</p>
                <p className="text-xs text-muted-foreground">
                  {instruction.steps.length} adım • {windowTypeLabels[windowType] ?? "Cam Sistemi"}
                </p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-8 w-8 rounded-full"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="px-4 pt-3">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                  i === currentStep
                    ? "bg-primary"
                    : i < currentStep
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        {currentStepData && (
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Adım {currentStep + 1}/{steps.length}
                </span>
              </div>
              <h4 className="font-semibold text-sm">{currentStepData.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{currentStepData.details}</p>
            </div>

            {/* Voice Text Preview */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-xs leading-relaxed italic text-muted-foreground">
                "{currentStepData.voiceText}"
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-1.5">
              {currentStepData.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs">{tip}</span>
                </div>
              ))}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="h-9 w-9 rounded-full"
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                onClick={isSpeaking ? stopSpeaking : playCurrentStep}
                disabled={!speechSupported || isMuted}
                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-white"
              >
                {isSpeaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={nextStep}
                disabled={currentStep >= steps.length - 1}
                className="h-9 w-9 rounded-full"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {!speechSupported && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Tarayıcınız sesli okuma desteklemiyor. Talimatları ekrandan takip edebilirsiniz.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Important Notes */}
        {instruction.importantNotes.length > 0 && (
          <div className="px-4 pb-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-800 dark:text-blue-300">Önemli Notlar</span>
              </div>
              <ul className="space-y-1">
                {instruction.importantNotes.map((note, i) => (
                  <li key={i} className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
