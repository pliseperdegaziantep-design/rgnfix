import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video,
  VideoOff,
  Camera,
  RotateCcw,
  Maximize2,
  X,
  CheckCircle2,
  Ruler,
  ArrowRight,
} from "lucide-react";

interface VideoMeasureHelperProps {
  currentStep: number;
  mountType: string;
  onCapture?: (imageData: string) => void;
}

const stepInstructions = [
  {
    title: "Pencere Çerçevesini Gösterin",
    description: "Kameranızı pencere çerçevesine doğrultun. Tüm çerçevenin görünür olduğundan emin olun.",
    overlay: "frame",
  },
  {
    title: "Montaj Noktasını Belirleyin",
    description: "Perdenin monte edileceği noktayı kameraya gösterin. Yüzeyin düz olduğundan emin olun.",
    overlay: "point",
  },
  {
    title: "Genişliği Ölçün",
    description: "Metrenizi pencerenin sol kenarından sağ kenarına doğru tutun. Kameraya gösterin.",
    overlay: "horizontal",
  },
  {
    title: "Yüksekliği Ölçün",
    description: "Metrenizi pencerenin üst kenarından alt kenarına doğru tutun. Kameraya gösterin.",
    overlay: "vertical",
  },
];

export default function VideoMeasureHelper({ currentStep, mountType, onCapture }: VideoMeasureHelperProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [guideStep, setGuideStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Tarayıcınız kamera erişimini desteklemiyor. Lütfen HTTPS üzerinden veya güncel bir tarayıcı ile deneyin.");
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isFrontCamera ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        setCameraError("Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini açın ve tekrar deneyin.");
      } else if (err?.name === "NotFoundError") {
        setCameraError("Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan emin olun.");
      } else {
        setCameraError("Kamera bağlantısı kurulamadı. Lütfen tekrar deneyin.");
      }
    }
  }, [isFrontCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const switchCamera = useCallback(() => {
    setIsFrontCamera((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isStreaming) {
      stopCamera();
      startCamera();
    }
  }, [isFrontCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);
    onCapture?.(imageData);
  }, [onCapture]);

  const downloadPhoto = useCallback((imageData: string) => {
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `olcu-foto-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const instruction = stepInstructions[guideStep] || stepInstructions[0];

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-black" : ""}`}>
      <Card className={`border-border/50 overflow-hidden ${isFullscreen ? "h-full rounded-none border-0" : ""}`}>
        <CardContent className={`p-0 ${isFullscreen ? "h-full" : ""}`}>
          {/* Camera View */}
          <div className={`relative bg-black ${isFullscreen ? "h-full" : "aspect-video"}`}>
            {!isStreaming && !capturedImage && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/80">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Video className="h-8 w-8" />
                </div>
                <div className="text-center px-4">
                  <p className="font-medium text-sm">Görüntülü Ölçü Yardımcısı</p>
                  <p className="text-xs text-white/60 mt-1">
                    Kameranızı açarak adım adım ölçü alma rehberliği alın
                  </p>
                </div>
                {cameraError && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg px-4 py-2 max-w-xs text-center">
                    <p className="text-xs text-red-200">{cameraError}</p>
                  </div>
                )}
                <Button
                  onClick={startCamera}
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  <Video className="h-4 w-4" />
                  {cameraError ? "Tekrar Dene" : "Kamerayı Aç"}
                </Button>
              </div>
            )}

            {/* Video Stream */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${!isStreaming || capturedImage ? "hidden" : ""}`}
              playsInline
              muted
            />

            {/* Captured Image */}
            {capturedImage && (
              <img src={capturedImage} className="w-full h-full object-cover" alt="Çekilen fotoğraf" />
            )}

            {/* Overlay Guides */}
            {isStreaming && !capturedImage && (
              <>
                {/* Horizontal measurement guide */}
                {instruction.overlay === "horizontal" && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-[10%] right-[10%] -translate-y-1/2">
                      <div className="h-0.5 bg-primary/80 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 border-l-2 border-primary" />
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 border-r-2 border-primary" />
                        <div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-primary/90 text-white text-xs px-2 py-0.5 rounded">
                          Genişlik
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vertical measurement guide */}
                {instruction.overlay === "vertical" && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/2 top-[10%] bottom-[10%] -translate-x-1/2">
                      <div className="w-0.5 h-full bg-primary/80 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 border-t-2 border-primary" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3 border-b-2 border-primary" />
                        <div className="absolute top-1/2 -translate-y-1/2 left-4 bg-primary/90 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                          Yükseklik
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Frame guide */}
                {instruction.overlay === "frame" && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[15%] left-[15%] right-[15%] bottom-[15%] border-2 border-dashed border-primary/60 rounded-lg">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-xs px-2 py-0.5 rounded">
                        Pencere çerçevesini bu alana hizalayın
                      </div>
                    </div>
                  </div>
                )}

                {/* Point guide */}
                {instruction.overlay === "point" && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/80 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary/80" />
                      </div>
                      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-primary/90 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                        Montaj noktası
                      </div>
                    </div>
                  </div>
                )}

                {/* Corner markers */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/50 rounded-tl" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/50 rounded-tr" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/50 rounded-bl" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/50 rounded-br" />
              </>
            )}

            {/* Controls overlay */}
            {isStreaming && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {!capturedImage ? (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={switchCamera}
                      className="bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={capturePhoto}
                      className="bg-white hover:bg-white/90 text-black rounded-full h-14 w-14 shadow-lg"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={stopCamera}
                      className="bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10"
                    >
                      <VideoOff className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => setCapturedImage(null)}
                      className="bg-black/40 hover:bg-black/60 text-white rounded-full gap-2 px-4"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Tekrar Çek
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => capturedImage && downloadPhoto(capturedImage)}
                      className="bg-black/40 hover:bg-black/60 text-white rounded-full gap-2 px-4"
                    >
                      <ArrowRight className="h-4 w-4" />
                      İndir
                    </Button>
                    <Button
                      onClick={() => {
                        setCapturedImage(null);
                        if (guideStep < stepInstructions.length - 1) {
                          setGuideStep(guideStep + 1);
                        }
                      }}
                      className="bg-primary hover:bg-primary/90 text-white rounded-full gap-2 px-4"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Sonraki Adım
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Fullscreen toggle */}
            {isStreaming && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full h-8 w-8"
              >
                {isFullscreen ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Instruction Panel */}
          {isStreaming && (
            <div className="p-4 bg-background border-t border-border/50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Ruler className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">
                      Adım {guideStep + 1}/{stepInstructions.length}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{instruction.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{instruction.description}</p>
                </div>
              </div>

              {/* Step indicators */}
              <div className="flex gap-1.5 mt-3">
                {stepInstructions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setGuideStep(i)}
                    className={`h-1.5 rounded-full flex-1 transition-colors ${
                      i === guideStep ? "bg-primary" : i < guideStep ? "bg-primary/40" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}
