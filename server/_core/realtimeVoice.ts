import type { Express } from "express";

const requestedModel = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";
const REALTIME_MODEL = requestedModel.startsWith("gpt-realtime") ? requestedModel : "gpt-realtime";
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE?.trim() || "marin";
const TTS_MODEL = process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
const TTS_VOICE = process.env.OPENAI_TTS_VOICE?.trim() || "marin";
const MODEL_CANDIDATES = Array.from(new Set([REALTIME_MODEL, "gpt-realtime", "gpt-realtime-mini"]));

function publicRealtimeError(status: number) {
  if (status === 401) return { code: "invalid_api_key", error: "OpenAI API anahtarı geçersiz veya iptal edilmiş." };
  if (status === 403) return { code: "realtime_access_denied", error: "Bu OpenAI projesinde Realtime API erişimi kullanılamıyor." };
  if (status === 429) return { code: "realtime_quota", error: "OpenAI canlı ses kredisi, bütçe limiti veya kotası yetersiz." };
  if (status === 404) return { code: "realtime_model_not_found", error: "OpenAI Realtime modeli bu projede kullanılamıyor." };
  if (status === 400) return { code: "realtime_request_rejected", error: "OpenAI canlı ses isteğini reddetti." };
  return { code: "realtime_connection_failed", error: "OpenAI canlı ses bağlantısı kurulamadı." };
}

function normalizeTurkishSpeech(text: string) {
  return text
    .replace(/\bRGNFIX\b/gi, "R G N Fiks")
    .replace(/\bcm\b/gi, "santimetre")
    .replace(/\bm²\b/gi, "metrekare")
    .replace(/\bPVC\b/gi, "P V C")
    .replace(/\bslim\b/gi, "silim")
    .replace(/\s+/g, " ")
    .trim();
}

async function createClientSecret(apiKey: string, model: string) {
  return fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        audio: { output: { voice: REALTIME_VOICE } },
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
}

async function createRealtimeCall(apiKey: string, sdp: string, model: string) {
  const form = new FormData();
  form.append("sdp", new Blob([sdp], { type: "application/sdp" }), "offer.sdp");
  form.append("session", new Blob([JSON.stringify({
    type: "realtime",
    model,
    audio: { output: { voice: REALTIME_VOICE } },
  })], { type: "application/json" }), "session.json");

  return fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(25_000),
  });
}

export function registerRealtimeVoiceRoutes(app: Express) {
  app.get("/api/ai/realtime/status", (_req, res) => {
    res.json({
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      provider: "openai",
      model: REALTIME_MODEL,
      fallbackModel: "gpt-realtime-mini",
      voice: REALTIME_VOICE,
      ttsModel: TTS_MODEL,
      ttsVoice: TTS_VOICE,
      mode: "webrtc-ephemeral-token-with-turkish-tts",
      disclosure: "Bu ses yapay zekâ tarafından oluşturulur.",
    });
  });

  app.post("/api/ai/tts", async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
    if (!apiKey) {
      res.status(503).json({ code: "missing_api_key", error: "OpenAI ses bağlantısı yapılandırılmamış." });
      return;
    }

    const rawText = typeof req.body?.text === "string" ? req.body.text : "";
    const text = normalizeTurkishSpeech(rawText).slice(0, 1200);
    if (!text) {
      res.status(400).json({ code: "missing_text", error: "Seslendirilecek metin bulunamadı." });
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: TTS_MODEL,
          voice: TTS_VOICE,
          input: text,
          response_format: "mp3",
          speed: 0.96,
          instructions: [
            "Türkiye Türkçesiyle, İstanbul Türkçesine yakın, doğal ve anlaşılır konuş.",
            "Cam kelimesini kesinlikle C harfiyle cam olarak söyle; gam deme.",
            "Ölçü kelimesindeki ö ve ü seslerini açık, doğru ve doğal telaffuz et.",
            "Çelik metre, plise perde, kancalı, vidalı, antrasit ve santimetre kelimelerini doğru telaffuz et.",
            "Satış danışmanı gibi sıcak konuş fakat abartılı tonlama yapma.",
            "Cümleyi yutmadan, kısa duraklamalarla ve normal hızda oku.",
          ].join(" "),
        }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("[OpenAI Turkish TTS] failed:", response.status, detail);
        res.status(response.status >= 400 && response.status < 500 ? response.status : 502).json({
          code: "tts_failed",
          error: "Türkçe ses oluşturulamadı.",
        });
        return;
      }

      const audio = Buffer.from(await response.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      res.setHeader("Cache-Control", "no-store");
      res.status(200).send(audio);
    } catch (error) {
      console.error("[OpenAI Turkish TTS] bridge error:", error);
      res.status(502).json({ code: "tts_bridge_error", error: "Türkçe ses servisine bağlanılamadı." });
    }
  });

  app.get("/api/ai/realtime/token", async (_req, res) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
    if (!apiKey) {
      res.status(503).json({ code: "missing_api_key", error: "OpenAI canlı ses bağlantısı yapılandırılmamış." });
      return;
    }

    try {
      let lastStatus = 502;
      let lastBody = "";

      for (const model of MODEL_CANDIDATES) {
        const response = await createClientSecret(apiKey, model);
        const responseBody = await response.text();
        if (response.ok) {
          const payload = JSON.parse(responseBody) as {
            value?: string;
            expires_at?: number;
            client_secret?: { value?: string; expires_at?: number };
          };
          const value = payload.value || payload.client_secret?.value;
          if (!value) {
            console.error("[OpenAI Realtime] Client secret response has no token:", responseBody);
            res.status(502).json({ code: "missing_ephemeral_token", error: "Canlı ses için geçici bağlantı anahtarı alınamadı." });
            return;
          }
          res.setHeader("Cache-Control", "no-store, private, max-age=0");
          res.json({
            value,
            expiresAt: payload.expires_at || payload.client_secret?.expires_at || null,
            model,
          });
          return;
        }

        lastStatus = response.status;
        lastBody = responseBody;
        console.error(`[OpenAI Realtime token] ${model} failed:`, response.status, responseBody);
        if (![400, 404].includes(response.status)) break;
      }

      const publicError = publicRealtimeError(lastStatus);
      console.error("[OpenAI Realtime token] Final failure body:", lastBody);
      res.status(lastStatus >= 400 && lastStatus < 500 ? lastStatus : 502).json(publicError);
    } catch (error) {
      console.error("[OpenAI Realtime token] Bridge error:", error);
      res.status(502).json({ code: "realtime_token_error", error: "Canlı ses geçici bağlantı anahtarı alınamadı." });
    }
  });

  app.post("/api/ai/realtime/call", async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
    if (!apiKey) {
      res.status(503).json({ code: "missing_api_key", error: "OpenAI canlı ses bağlantısı yapılandırılmamış." });
      return;
    }

    const sdp = typeof req.body?.sdp === "string" ? req.body.sdp.trim() : "";
    if (!sdp || sdp.length > 100_000) {
      res.status(400).json({ code: "invalid_sdp", error: "Geçerli bir WebRTC bağlantı isteği bulunamadı." });
      return;
    }

    try {
      let lastStatus = 502;
      let lastBody = "";

      for (const model of MODEL_CANDIDATES) {
        const response = await createRealtimeCall(apiKey, sdp, model);
        const responseBody = await response.text();
        if (response.ok) {
          res.setHeader("Content-Type", "application/sdp");
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("X-RGNFIX-Realtime-Model", model);
          res.status(201).send(responseBody);
          return;
        }

        lastStatus = response.status;
        lastBody = responseBody;
        console.error(`[OpenAI Realtime call] ${model} failed:`, response.status, responseBody);
        if (![400, 404].includes(response.status)) break;
      }

      const publicError = publicRealtimeError(lastStatus);
      console.error("[OpenAI Realtime call] Final failure body:", lastBody);
      res.status(lastStatus >= 400 && lastStatus < 500 ? lastStatus : 502).json(publicError);
    } catch (error) {
      console.error("[OpenAI Realtime call] Bridge error:", error);
      res.status(502).json({ code: "realtime_bridge_error", error: "OpenAI canlı ses sunucu bağlantısı şu anda kurulamadı." });
    }
  });
}
