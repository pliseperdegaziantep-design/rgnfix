import { useCallback, useEffect, useRef, useState } from "react";
import { CircleStop, Maximize2, Minimize2, RefreshCcw, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { CameraGuideMode } from "./rules";

interface LiveMeasurementCameraProps {
  mode: CameraGuideMode;
  instruction: string;
  onRecordingSaved?: (recording: { key: string; url: string }) => void;
}

export default function LiveMeasurementCamera({ mode, instruction, onRecordingSaved }: LiveMeasurementCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [frontCamera, setFrontCamera] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const stopCamera = useCallback(() => {
    stopRecording();
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
  }, [stopRecording]);

  const startCamera = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Bu cihazda kamera açılamıyor. Güncel bir tarayıcı veya RGNFIX mobil uygulamasını kullanın.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: frontCamera ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
      if (name === "NotAllowedError") setError("Kamera izni kapalı. Tarayıcı ayarlarından izni açıp tekrar deneyin.");
      else if (name === "NotFoundError") setError("Cihazda kullanılabilir kamera bulunamadı.");
      else setError("Kamera bağlantısı kurulamadı. Tekrar deneyin.");
    }
  }, [frontCamera, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (streaming) void startCamera();
    // Camera switch is intentionally the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontCamera]);

  const uploadRecording = useCallback(async (blob: Blob) => {
    setUploading(true);
    setError("");
    try {
      const response = await fetch("/api/uploads/measurement-recording", {
        method: "POST",
        headers: {
          "content-type": blob.type || "video/webm",
          "x-rgnfix-recording-consent": "granted",
        },
        credentials: "include",
        body: blob,
      });
      const payload = await response.json().catch(() => null) as { key?: string; url?: string; error?: string } | null;
      if (!response.ok || !payload?.key || !payload.url) {
        throw new Error(payload?.error || "Ölçüm kaydı yüklenemedi.");
      }
      setSaved(true);
      onRecordingSaved?.({ key: payload.key, url: payload.url });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Ölçüm kaydı yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }, [onRecordingSaved]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !recordingConsent) return;
    if (!("MediaRecorder" in window)) {
      setError("Bu cihaz video kaydını desteklemiyor.");
      return;
    }

    const preferredType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: preferredType, videoBitsPerSecond: 900_000 });
    chunksRef.current = [];
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      chunksRef.current = [];
      if (blob.size > 0 && recordingConsent) void uploadRecording(blob);
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    setSaved(false);
    setRecording(true);
  }, [recordingConsent, uploadRecording]);

  const warningText = mode === "width"
    ? "Metreyi profilin dışından değil, camın sol iç kenarından sağ iç kenarına düz tutun."
    : mode === "height"
      ? "Metreyi camın üst iç kenarından alt iç kenarına dik ve gergin tutun."
      : "Kamerayı cama doğrultun. Sistem ölçü tahmini yapmaz; yalnızca doğru noktaları gösterir.";

  return (
    <div className={fullscreen ? "fixed inset-0 z-[80] bg-black" : ""}>
      <Card className={`overflow-hidden border-border/60 ${fullscreen ? "h-full rounded-none border-0" : ""}`}>
        <CardContent className={`p-0 ${fullscreen ? "h-full" : ""}`}>
          <div className={`relative overflow-hidden bg-black ${fullscreen ? "h-full" : "aspect-[3/4] sm:aspect-video lg:aspect-[3/4]"}`}>
            {!streaming && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-5 text-center text-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><Video className="h-7 w-7" /></div>
                <div>
                  <p className="font-semibold">Canlı Kamera Denetimi</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">Fotoğraf çekmez. Ölçüyü camın doğru noktalarından almanız için sizi uyarır.</p>
                </div>
                {error && <p className="max-w-sm rounded-xl border border-red-300/30 bg-red-500/15 px-3 py-2 text-xs text-red-100">{error}</p>}
                <Button onClick={() => void startCamera()} className="gap-2"><Video className="h-4 w-4" />{error ? "Tekrar Dene" : "Kamerayı Aç"}</Button>
              </div>
            )}

            <video ref={videoRef} playsInline muted className={`h-full w-full object-cover ${streaming ? "block" : "hidden"}`} />

            {streaming && (
              <>
                <div className="pointer-events-none absolute inset-x-3 top-3 rounded-xl bg-black/70 px-3 py-2 text-center text-[11px] leading-4 text-white backdrop-blur-sm">{warningText}</div>

                {mode === "frame" && (
                  <div className="pointer-events-none absolute inset-[14%] rounded-2xl border-2 border-dashed border-cyan-300/90">
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-[11px] text-white">Camı çerçeveye alın</span>
                  </div>
                )}

                {mode === "width" && (
                  <div className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2">
                    <div className="relative h-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]">
                      <div className="absolute -left-0.5 -top-4 h-9 w-1 rounded bg-cyan-300" />
                      <div className="absolute -right-0.5 -top-4 h-9 w-1 rounded bg-cyan-300" />
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white">ÖNCE EN · CAMDAN CAMA</div>
                    </div>
                  </div>
                )}

                {mode === "height" && (
                  <div className="pointer-events-none absolute bottom-[8%] left-1/2 top-[12%] -translate-x-1/2">
                    <div className="relative h-full w-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.8)]">
                      <div className="absolute -left-4 -top-0.5 h-1 w-9 rounded bg-cyan-300" />
                      <div className="absolute -bottom-0.5 -left-4 h-1 w-9 rounded bg-cyan-300" />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black/70 px-3 py-1 text-xs font-medium text-white">SONRA BOY · CAMDAN CAMA</div>
                    </div>
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-3 bottom-28 rounded-xl bg-black/70 px-3 py-2 text-center text-xs font-medium leading-5 text-white backdrop-blur-sm">{instruction}</div>

                <div className="absolute inset-x-3 bottom-3 space-y-2 rounded-xl bg-black/70 p-3 text-white backdrop-blur-sm">
                  <Label className="flex cursor-pointer items-start gap-2 text-[11px] leading-4">
                    <input
                      type="checkbox"
                      checked={recordingConsent}
                      onChange={event => {
                        if (!event.target.checked && recording) stopRecording();
                        setRecordingConsent(event.target.checked);
                      }}
                      className="mt-0.5 h-4 w-4"
                    />
                    <span>Ölçüm videosunun kaydedilip siparişime eklenmesine izin veriyorum.</span>
                  </Label>
                  <div className="flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" onClick={() => setFrontCamera(value => !value)} aria-label="Kamerayı değiştir" className="rounded-full bg-black/55 text-white hover:bg-black/70"><RefreshCcw className="h-4 w-4" /></Button>
                    {recording ? (
                      <Button onClick={stopRecording} className="gap-2 bg-red-600 hover:bg-red-700"><CircleStop className="h-4 w-4" /> Kaydı Bitir</Button>
                    ) : (
                      <Button onClick={startRecording} disabled={!recordingConsent || uploading} className="gap-2"><Video className="h-4 w-4" />{uploading ? "Yükleniyor…" : saved ? "Kayıt Eklendi" : "Kaydı Başlat"}</Button>
                    )}
                    <Button size="icon" variant="secondary" onClick={stopCamera} aria-label="Kamerayı kapat" className="rounded-full bg-black/55 text-white hover:bg-black/70"><VideoOff className="h-4 w-4" /></Button>
                    <Button size="icon" variant="secondary" onClick={() => setFullscreen(value => !value)} aria-label={fullscreen ? "Tam ekrandan çık" : "Tam ekran"} className="rounded-full bg-black/55 text-white hover:bg-black/70">{fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button>
                  </div>
                  {error && <p className="text-center text-[11px] text-red-200">{error}</p>}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
