import type { Express } from "express";

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE?.trim() || "coral";

const REALTIME_INSTRUCTIONS = [
  "Türkçe konuş.",
  "Ses tonun dinamik, akıcı, sıcak, kibar ve samimi olsun.",
  "Bir müşteri danışmanı gibi doğal konuş; robotik, ağır veya monoton konuşma.",
  "Cümlelere hızlı başla, gereksiz bekleme yapma.",
  "Ölçü yönlendirmesinde kısa, net ve güven veren cümleler kullan.",
  "Sana verilen yönlendirme metnini anlamını değiştirmeden söyle; ek açıklama yapma ve tekrar etme.",
  "Sayıları, virgüllü ölçüleri ve santimetre ifadelerini Türkçe ve anlaşılır telaffuz et.",
].join(" ");

export function registerRealtimeVoiceRoutes(app: Express) {
  app.get("/api/ai/realtime/status", (_req, res) => {
    res.json({
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      provider: "openai",
      model: REALTIME_MODEL,
      voice: REALTIME_VOICE,
      mode: "webrtc-realtime",
      disclosure: "Bu ses yapay zekâ tarafından oluşturulur.",
    });
  });

  app.post("/api/ai/realtime/call", async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY?.trim() || "";
    if (!apiKey) {
      res.status(503).json({ error: "OpenAI canlı ses bağlantısı yapılandırılmamış." });
      return;
    }

    const sdp = typeof req.body?.sdp === "string" ? req.body.sdp.trim() : "";
    if (!sdp || sdp.length > 100_000) {
      res.status(400).json({ error: "Geçerli bir WebRTC bağlantı isteği bulunamadı." });
      return;
    }

    const form = new FormData();
    form.append("sdp", new Blob([sdp], { type: "application/sdp" }), "offer.sdp");
    form.append("session", new Blob([JSON.stringify({
      type: "realtime",
      model: REALTIME_MODEL,
      output_modalities: ["audio"],
      instructions: REALTIME_INSTRUCTIONS,
      audio: {
        output: {
          voice: REALTIME_VOICE,
          speed: 1.15,
        },
      },
    })], { type: "application/json" }), "session.json");

    try {
      const response = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(25_000),
      });

      const responseBody = await response.text();
      if (!response.ok) {
        console.error("[OpenAI Realtime] Connection failed:", response.status, responseBody);
        const status = response.status === 401 ? 401 : response.status === 429 ? 429 : 502;
        res.status(status).json({
          error: status === 401
            ? "OpenAI API anahtarı geçersiz."
            : status === 429
              ? "OpenAI canlı ses kredisi veya kotası yetersiz."
              : "OpenAI canlı ses bağlantısı kurulamadı.",
        });
        return;
      }

      res.setHeader("Content-Type", "application/sdp");
      res.setHeader("Cache-Control", "no-store");
      res.status(201).send(responseBody);
    } catch (error) {
      console.error("[OpenAI Realtime] Bridge error:", error);
      res.status(502).json({ error: "Canlı ses bağlantısı şu anda kurulamadı." });
    }
  });
}
