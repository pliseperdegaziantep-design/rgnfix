import type { Express } from "express";
import { randomUUID } from "crypto";
import { PutObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getLocalAuthUser } from "./localAuth";

function setting(name: string) {
  return process.env[name]?.trim() ?? "";
}

function storageConfigured() {
  return Boolean(
    setting("S3_BUCKET") &&
      setting("S3_REGION") &&
      setting("S3_ACCESS_KEY_ID") &&
      setting("S3_SECRET_ACCESS_KEY")
  );
}

function client() {
  return new S3Client({
    region: setting("S3_REGION"),
    endpoint: setting("S3_ENDPOINT") || undefined,
    forcePathStyle: setting("S3_FORCE_PATH_STYLE") === "true",
    credentials: {
      accessKeyId: setting("S3_ACCESS_KEY_ID"),
      secretAccessKey: setting("S3_SECRET_ACCESS_KEY"),
    },
  });
}

const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export function registerUploadRoutes(app: Express) {
  app.get("/api/uploads/status", async (req, res) => {
    const user = await getLocalAuthUser(req);
    res.json({ configured: storageConfigured(), authenticated: Boolean(user) });
  });

  app.post("/api/uploads/measurement-photo", async (req, res) => {
    const user = await getLocalAuthUser(req);
    if (!user || user.id <= 0 || user.role !== "user") {
      res.status(401).json({ error: "Fotoğraf yüklemek için müşteri girişi gerekli." });
      return;
    }
    if (!storageConfigured()) {
      res.status(503).json({ error: "Fotoğraf yükleme altyapısı henüz aktif değil." });
      return;
    }

    const dataUrl = typeof req.body?.dataUrl === "string" ? req.body.dataUrl : "";
    const match = /^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: "Yalnızca JPG, PNG, WEBP veya HEIC fotoğraf yüklenebilir." });
      return;
    }

    const mimeType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length === 0 || buffer.length > 8 * 1024 * 1024) {
      res.status(400).json({ error: "Fotoğraf boyutu 8 MB'den küçük olmalıdır." });
      return;
    }

    const extension = mimeExtensions[mimeType] || "jpg";
    const key = `measurement-photos/${user.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const bucket = setting("S3_BUCKET");
    const s3 = client();

    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "private, max-age=0, no-store",
        Metadata: { userId: String(user.id), purpose: "measurement-support" },
      }));

      const publicBase = setting("S3_PUBLIC_BASE_URL").replace(/\/$/, "");
      const url = publicBase
        ? `${publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`
        : await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 7 * 24 * 60 * 60 });

      res.status(201).json({ success: true, key, url, expiresInDays: publicBase ? null : 7 });
    } catch (error) {
      console.error("[Upload] Measurement photo failed:", error);
      res.status(500).json({ error: "Fotoğraf yüklenemedi." });
    }
  });
}
