import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Maximize2, Minimize2, RefreshCcw, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CameraGuideMode } from "./rules";

interface LiveMeasurementCameraProps {
  mode: CameraGuideMode;
  instruction: string;
  onCapture?: (imageData: string) => void;
}

export default function LiveMeasurementCamera({ mode, instruction, onCapture }: LiveMeasurementCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [frontCamera, setFrontCamera] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu cihazda tarayıcı üzerinden kamera açılamıyor. Güncel bir tarayıcı veya RGNFIX mobil uygulamasını kullanın.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: frontCamera ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (cameraError) {
      const name = cameraError instanceof DOMException ? cameraError.name : "";
      if (name === "NotAllowedError") {
        setError("Kamera izni kapalı. Tarayıcı ayarlarından kamera iznini açıp tekrar deneyin.");
      } else if (name === "NotFoundError") {
        setError("Cihazda kullanılabilir kamera bulunamadı.");
      } else {
        setError("Kamera bağlantısı kurulamadı. Tekrar deneyin.");
      }
    }
  }, [frontCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (streaming) void startCamera();
    // Camera change is intentionally the only trigger here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture?.(canvas.toDataURL("image/jpeg", 0.86));
  }, [onCapture]);

  return (
    <div className={fullscreen ? "fixed inset-0 z-[80] bg-black" : ""}>
      <Card className={`overflow-hidden border-border/60 ${fullscreen ? "h-full rounded-none border-0" : ""}`}>
        <CardContent className={`p-0 ${fullscreen ? "h-full" : ""}`}>
          <div className={`relative overflow-hidden bg-black ${fullscreen ? "h-full" : "aspect-[3/4] sm:aspect-video lg:aspect-[3/4]"}`}>
            {!streaming && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-5 text-center text-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <Video className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-semibold">Canlı Ölçü Yönlendirmesi</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">Kamera ölçü hesaplamaz; yalnızca çelik metreyi doğru noktaya yerleştirmenize yardımcı olur.</p>
                </div>
                {error && <p className="max-w-sm rounded-xl border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs text-red-100">{error}</p>}
                <Button onClick={() => void startCamera()} className="gap-2">
                  <Video className="h-4 w-4" />
                  {error ? "Tekrar Dene" : "Kamerayı Aç"}
                </Button>
              </div>
            )}

            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${streaming ? "block" : "hidden"}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {streaming && (
              <>
                <div className="pointer-events-none absolute inset-x-3 top-3 rounded-xl bg-black/65 px-3 py-2 text-center text-[11px] leading-4 text-white backdrop-blur-sm">
                  Kamera yalnızca doğru ölçüm noktalarını göstermek için kullanılır. Ölçüyü çelik metreden okuyarak siz girmelisiniz.
                </div>

                {mode === "frame" && (
                  <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-dashed border-cyan-300/90">
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-[11px] text-white">Camın ölçülecek alanını çerçeveye alın</span>
                  </div>
                )}

                {mode === "width" && (
                  <div className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2">
                    <div className="relative h-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]">
                      <div className="absolute -left-0.5 -top-4 h-9 w-1 rounded bg-cyan-300" />
                      <div className="absolute -right-0.5 -top-4 h-9 w-1 rounded bg-cyan-300" />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white">EN: Soldan sağa</div>
                      <span className="absolute -bottom-7 left-0 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Başlangıç</span>
                      <span className="absolute -bottom-7 right-0 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Bitiş</span>
                    </div>
                  </div>
                )}

                {mode === "height" && (
                  <div className="pointer-events-none absolute bottom-[8%] left-1/2 top-[12%] -translate-x-1/2">
                    <div className="relative h-full w-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]">
                      <div className="absolute -left-4 -top-0.5 h-1 w-9 rounded bg-cyan-300" />
                      <div className="absolute -bottom-0.5 -left-4 h-1 w-9 rounded bg-cyan-300" />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white">BOY: Yukarıdan aşağıya</div>
                      <span className="absolute left-4 top-0 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Başlangıç</span>
                      <span className="absolute bottom-0 left-4 rounded bg-black/70 px-2 py-1 text-[10px] text-white">Bitiş</span>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-3 bottom-20 rounded-xl bg-black/65 px-3 py-2 text-center text-xs font-medium leading-5 text-white backdrop-blur-sm">
                  {instruction}
                </div>

                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => setFrontCamera(value => !value)} aria-label="Kamerayı değiştir" className="rounded-full bg-black/55 text-white hover:bg-black/70">
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={capture} aria-label="Ölçü fotoğrafı çek" className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90">
                    <Camera className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={stopCamera} aria-label="Kamerayı kapat" className="rounded-full bg-black/55 text-white hover:bg-black/70">
                    <VideoOff className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => setFullscreen(value => !value)} aria-label={fullscreen ? "Tam ekrandan çık" : "Tam ekran"} className="rounded-full bg-black/55 text-white hover:bg-black/70">
                    {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
