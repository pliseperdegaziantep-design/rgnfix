import type { Express } from "express";

const requestedModel = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";
const REALTIME_MODEL = requestedModel.startsWith("gpt-realtime") ? requestedModel : "gpt-realtime";
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE?.trim() || "marin";
const MODEL_CANDIDATES = Array.from(new Set([REALTIME_MODEL, "gpt-realtime", "gpt-realtime-mini"]));

function publicRealtimeError(status: number) {
  if (status === 401) return { code: "invalid_api_key", error: "OpenAI API anahtarı geçersiz veya iptal edilmiş." };
  if (status === 403) return { code: "realtime_access_denied", error: "Bu OpenAI projesinde Realtime API erişimi kullanılamıyor." };
  if (status === 429) return { code: "realtime_quota", error: "OpenAI canlı ses kredisi, bütçe limiti veya kotası yetersiz." };
  if (status === 404) return { code: "realtime_model_not_found", error: "OpenAI Realtime modeli bu projede kullanılamıyor." };
  if (status === 400) return { code: "realtime_request_rejected", error: "OpenAI canlı ses isteğini reddetti." };
  return { code: "realtime_connection_failed", error: "OpenAI canlı ses bağlantısı kurulamadı." };
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
      mode: "webrtc-ephemeral-token",
      disclosure: "Bu ses yapay zekâ tarafından oluşturulur.",
    });
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

  // Server-side SDP bridge is kept as a fallback for browsers or networks that block direct OpenAI WebRTC negotiation.
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
      res.status(502).json({ code: "realtime_bridge_error", error: "Canlı ses sunucu bağlantısı şu anda kurulamadı." });
    }
  });
}
