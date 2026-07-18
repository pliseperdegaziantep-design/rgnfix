import { useRef, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, CheckCircle2, ImagePlus, LogIn, Share2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

const dynamicImport = new Function("moduleName", "return import(moduleName)") as (moduleName: string) => Promise<any>;

function isNative() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Lütfen bir fotoğraf seçin.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Fotoğraf 15 MB'den küçük olmalıdır.");

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Fotoğraf okunamadı."));
      element.src = objectUrl;
    });
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Fotoğraf işlenemedi.");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function PhotoSupport() {
  const { isAuthenticated, loading } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setUploadedUrl("");
    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fotoğraf hazırlanamadı.");
    } finally {
      setBusy(false);
    }
  };

  const openCamera = async () => {
    if (!isNative()) {
      fileInput.current?.click();
      return;
    }
    try {
      const { Camera: NativeCamera, CameraResultType, CameraSource } = await dynamicImport("@capacitor/camera");
      const photo = await NativeCamera.getPhoto({
        quality: 82,
        width: 1600,
        correctOrientation: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (photo.dataUrl) {
        setPreview(photo.dataUrl);
        setUploadedUrl("");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kamera açılamadı.");
    }
  };

  const upload = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const response = await fetch("/api/uploads/measurement-photo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dataUrl: preview }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Fotoğraf yüklenemedi.");
      setUploadedUrl(data.url);
      toast.success("Ölçü fotoğrafı güvenli şekilde yüklendi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fotoğraf yüklenemedi.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!uploadedUrl) return;
    const text = `RGNFIX ölçü destek fotoğrafım: ${uploadedUrl}`;
    try {
      if (isNative()) {
        const { Share } = await dynamicImport("@capacitor/share");
        await Share.share({ title: "RGNFIX Ölçü Fotoğrafı", text, url: uploadedUrl, dialogTitle: "Fotoğrafı paylaş" });
        return;
      }
      if (navigator.share) {
        await navigator.share({ title: "RGNFIX Ölçü Fotoğrafı", text, url: uploadedUrl });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Fotoğraf bağlantısı kopyalandı.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Fotoğraf paylaşılamadı.");
    }
  };

  if (loading) return <div className="container py-16 text-center text-muted-foreground">Yükleniyor…</div>;
  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-16 text-center"><Camera className="mx-auto h-12 w-12 text-primary" /><h1 className="mt-4 text-2xl font-serif font-bold">Ölçü Fotoğrafı</h1><p className="mt-3 text-muted-foreground">Fotoğraf yüklemek için müşteri hesabınıza giriş yapın.</p><Link href="/giris"><Button className="mt-6 gap-2"><LogIn className="h-4 w-4" />Giriş Yap / Kayıt Ol</Button></Link></div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 sm:py-12">
      <div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"><Camera className="h-8 w-8 text-primary" /></div><h1 className="mt-5 text-3xl font-serif font-bold">Ölçü Fotoğrafı Gönder</h1><p className="mx-auto mt-3 max-w-xl text-muted-foreground">Cam veya pencerenizin fotoğrafını çekin. Fotoğrafı destek ekibimizle paylaşarak ölçü ve montaj konusunda yardım alın.</p></div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={event => void chooseFile(event.target.files?.[0])} />
          {!preview ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <ImagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Fotoğrafta camın veya pencerenin tamamının görünmesine dikkat edin.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => void openCamera()} className="gap-2"><Camera className="h-4 w-4" />Kamerayı Aç</Button><Button variant="outline" onClick={() => fileInput.current?.click()} className="gap-2"><ImagePlus className="h-4 w-4" />Galeriden Seç</Button></div>
            </div>
          ) : (
            <div className="space-y-5">
              <img src={preview} alt="Seçilen ölçü fotoğrafı" className="max-h-[480px] w-full rounded-2xl bg-muted object-contain" />
              {uploadedUrl ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30"><div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" />Fotoğraf yüklendi</div><p className="mt-2 break-all text-xs text-muted-foreground">{uploadedUrl}</p></div>
              ) : null}
              <div className="flex flex-col gap-3 sm:flex-row"><Button onClick={() => void upload()} disabled={busy || Boolean(uploadedUrl)} className="gap-2"><UploadCloud className="h-4 w-4" />{busy ? "Yükleniyor…" : uploadedUrl ? "Yüklendi" : "Fotoğrafı Yükle"}</Button>{uploadedUrl && <Button variant="outline" onClick={() => void share()} className="gap-2"><Share2 className="h-4 w-4" />Paylaş</Button>}<Button variant="ghost" onClick={() => { setPreview(""); setUploadedUrl(""); }}>Başka Fotoğraf Seç</Button></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
