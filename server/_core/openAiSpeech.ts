import { createHash } from "crypto";
import type { Express, Request } from "express";

const DEFAULT_MODEL = "gpt-4o-mini-tts-2025-12-15";
const DEFAULT_VOICE = "marin";
const MAX_TEXT_LENGTH = 1200;
const CACHE_LIMIT = 120;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 100;

const STYLE_INSTRUCTIONS = [
  "Türkçe konuş.",
  "Sesin kibar, samimi, sıcak ve güven verici olsun.",
  "Konuşma doğal, gerçekçi ve akıcı duyulsun; robotik bir ton kullanma.",
  "Ölçü aldırırken sakin, net ve destekleyici ol.",
  "Ne çok hızlı ne çok yavaş konuş; cümle aralarında doğal kısa duraklamalar bırak.",
  "Sayıları ve santimetre ifadelerini anlaşılır şekilde telaffuz et.",
].join(" ");

type RateEntry = { count: number; resetAt: number };

const audioCache = new Map<string, Buffer>();
const pendingAudio = new Map<string, Promise<Buffer>>();
const rateEntries = new Map<string, RateEntry>();

export function normalizeSpeechText(value: unknown): string {
  if (typeof value !== "string") throw new Error("Seslendirilecek metin bulunamadı.");
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("Seslendirilecek metin boş olamaz.");
  if (text.length > MAX_TEXT_LENGTH) throw new Error(`Seslendirme metni en fazla ${MAX_TEXT_LENGTH} karakter olabilir.`);
  return text;
}

export function getSpeechSettings() {
  return {
    model: process.env.OPENAI_TTS_MODEL?.trim() || DEFAULT_MODEL,
    voice: process.env.OPENAI_TTS_VOICE?.trim() || DEFAULT_VOICE,
    speed: Number(process.env.OPENAI_TTS_SPEED || "0.97"),
  };
}

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function consumeRateLimit(req: Request): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const current = rateEntries.get(key);
  if (!current || now >= current.resetAt) {
    rateEntries.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

function cacheKey(text: string): string {
  const settings = getSpeechSettings();
  return createHash("sha256")
    .update(`${settings.model}|${settings.voice}|${settings.speed}|${STYLE_INSTRUCTIONS}|${text}`)
    .digest("hex");
}

function putCache(key: string, buffer: Buffer) {
  if (audioCache.size >= CACHE_LIMIT) {
    const oldest = audioCache.keys().next().value as string | undefined;
    if (oldest) audioCache.delete(oldest);
  }
  audioCache.set(key, buffer);
}

async function generateSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
  if (!apiKey) throw new Error("OPENAI_API_KEY bulunamadı.");

  const key = cacheKey(text);
  const cached = audioCache.get(key);
  if (cached) return cached;

  const existing = pendingAudio.get(key);
  if (existing) return existing;

  const task = (async () => {
    const settings = getSpeechSettings();
    const baseUrl = (process.env.OPENAI_API_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: settings.model,
        voice: settings.voice,
        input: text,
        instructions: STYLE_INSTRUCTIONS,
        response_format: "mp3",
        speed: Number.isFinite(settings.speed) ? Math.min(1.2, Math.max(0.8, settings.speed)) : 0.97,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI TTS hatası: ${response.status} ${body}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) throw new Error("OpenAI boş ses verisi döndürdü.");
    putCache(key, buffer);
    return buffer;
  })().finally(() => pendingAudio.delete(key));

  pendingAudio.set(key, task);
  return task;
}

export function registerOpenAiSpeechRoutes(app: Express) {
  app.get("/api/ai/speech/status", (_req, res) => {
    const settings = getSpeechSettings();
    res.json({
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      provider: "openai",
      model: settings.model,
      voice: settings.voice,
      disclosure: "Bu ses yapay zekâ tarafından oluşturulur.",
    });
  });

  app.post("/api/ai/speech", async (req, res) => {
    if (!consumeRateLimit(req)) {
      res.status(429).json({ error: "Sesli yönlendirme limiti aşıldı. Birkaç dakika sonra tekrar deneyin." });
      return;
    }

    try {
      const text = normalizeSpeechText(req.body?.text);
      const audio = await generateSpeech(text);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      res.setHeader("Cache-Control", "private, max-age=86400");
      res.setHeader("X-RGNFIX-Voice", getSpeechSettings().voice);
      res.send(audio);
    } catch (error) {
      console.error("[OpenAI TTS] Speech generation failed:", error);
      const message = error instanceof Error ? error.message : String(error);
      const normalized = message.toLowerCase();
      const status = normalized.includes("401") ? 401
        : normalized.includes("429") || normalized.includes("quota") || normalized.includes("billing") ? 429
          : normalized.includes("bulunamadı") ? 503
            : normalized.includes("en fazla") || normalized.includes("boş") ? 400
              : 502;
      res.status(status).json({
        error: status === 429
          ? "OpenAI seslendirme kotası veya kredisi yetersiz."
          : status === 401
            ? "OpenAI API anahtarı geçersiz."
            : status === 503
              ? "OpenAI seslendirme bağlantısı yapılandırılmamış."
              : status === 400
                ? message
                : "Doğal seslendirme şu anda oluşturulamadı.",
      });
    }
  });
}
