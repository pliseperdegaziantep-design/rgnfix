import { createHash } from "crypto";
import type { Express, Request } from "express";
import { z } from "zod";
import { appDataRecords } from "../../drizzle/schema";
import { getDb } from "../db";

const allowedRecordTypes = [
  "measurement_session",
  "price_calculation",
  "color_advice",
  "ai_conversation",
  "order_draft",
] as const;

const captureSchema = z.object({
  sessionId: z.string().min(8).max(64),
  recordType: z.enum(allowedRecordTypes),
  payload: z.record(z.string(), z.unknown()),
});

const requestLog = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim() || req.ip || "unknown";
  return createHash("sha256").update(`${process.env.DATA_HASH_SALT || process.env.SESSION_SECRET || "rgnfix"}:${ip}`).digest("hex");
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = requestLog.get(key);
  if (!current || current.resetAt <= now) {
    requestLog.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 30;
}

export function registerDataCaptureRoutes(app: Express) {
  app.post("/api/data/capture", async (req, res) => {
    const ipHash = getClientKey(req);
    if (isRateLimited(ipHash)) {
      res.status(429).json({ ok: false, error: "Çok fazla kayıt isteği gönderildi." });
      return;
    }

    const parsed = captureSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: "Gönderilen veri geçersiz." });
      return;
    }

    const serializedPayload = JSON.stringify(parsed.data.payload);
    if (serializedPayload.length > 100_000) {
      res.status(413).json({ ok: false, error: "Gönderilen veri çok büyük." });
      return;
    }

    const db = await getDb();
    if (!db) {
      res.status(503).json({ ok: false, error: "Veritabanı bağlantısı hazır değil." });
      return;
    }

    try {
      await db.insert(appDataRecords).values({
        sessionId: parsed.data.sessionId,
        recordType: parsed.data.recordType,
        payload: parsed.data.payload,
        ipHash,
        userAgent: req.get("user-agent")?.slice(0, 500) || null,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error("[DataCapture] Failed to persist record:", error);
      res.status(500).json({ ok: false, error: "Veri güvenli şekilde kaydedilemedi." });
    }
  });
}
