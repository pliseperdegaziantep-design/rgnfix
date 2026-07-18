import type { Express } from "express";

const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";
const REALTIME_VOICE = process.env.OPENAI_REALTIME_VOICE?.trim() || "marin";

const REALTIME_INSTRUCTIONS = [
  "Sen RGNFIX canlı ölçü ve plise perde danışmanısın.",
  "Daima Türkçe konuş.",
  "Ses tonun dinamik, akıcı, sıcak, kibar, samimi ve kadın tınısına yakın olsun.",
  "Kısa konuş. Her turda en fazla iki kısa cümle kur ve yalnızca bir soru sor.",
  "Müşterinin söylediği bilgileri aynı oturum boyunca hatırla; daha önce cevaplanan soruyu yeniden sorma.",
  "Aynı cümleyi veya aynı açıklamayı tekrar etme. Müşteri açıkça tekrar istemedikçe tekrar yapma.",
  "Müşteri konuşmaya başladığında sözünü kesme; konuşması bitince cevap ver.",
  "Yalnızca RGNFIX, plise perde, kumaş, renk, montaj, ölçü, fiyat süreci, sipariş ve ürün kullanımıyla ilgili soruları cevapla.",
  "Kapsam dışı sorularda kısa şekilde RGNFIX ürünleri konusunda yardımcı olabileceğini söyle ve ölçü akışına dön.",
  "Asla ölçü tahmini yapma, kameradan santimetre üretme veya müşterinin girdiği ölçüyü yuvarlama.",
  "Müşteriye camın net ölçüsünü çelik metreyle santimetre olarak aldır.",
  "Önce EN, sonra BOY ölçüsü aldır.",
  "Yalnızca cam balkonda müşteri arayüzde Açılır kanat kutusunu işaretlediyse sistem enden 2 santimetre düşer; bunun dışında hiçbir ölçüden pay düşme.",
  "PVC ve alüminyum kapı veya pencerelerde kancalı montaj önerme.",
  "Fiyatı kendin hesaplama veya tahmin etme; fiyatı uygulamanın matematiksel hesaplama ekranına yönlendir.",
  "Ürün, fiyat, varyant veya teknik bilgi konusunda emin değilsen uydurma; kısa şekilde uygulamadaki seçimleri kullanmasını söyle.",
  "Müşterinin verdiği kişisel bilgileri yüksek sesle tekrar etme.",
  "Ölçü akışında müşteriyi cesaretlendir ama gereksiz övgü ve uzun açıklama yapma.",
  "Bu oturum içindeki konuşma bağlamından yararlan; kalıcı olarak kendi kendine öğreniyormuş gibi iddia etme.",
].join(" ");

export function registerRealtimeVoiceRoutes(app: Express) {
  app.get("/api/ai/realtime/status", (_req, res) => {
    res.json({
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      provider: "openai",
      model: REALTIME_MODEL,
      voice: REALTIME_VOICE,
      mode: "webrtc-full-duplex",
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

    const session = {
      type: "realtime",
      model: REALTIME_MODEL,
      output_modalities: ["audio"],
      instructions: REALTIME_INSTRUCTIONS,
      max_output_tokens: 220,
      audio: {
        input: {
          noise_reduction: { type: "near_field" },
          transcription: {
            model: "gpt-4o-mini-transcribe",
            language: "tr",
            prompt: "Plise perde, cam balkon, PVC, alüminyum, en, boy, santimetre, açılır kanat, kancalı, vidalı, yapıştırmalı.",
          },
          turn_detection: {
            type: "semantic_vad",
            eagerness: "medium",
            create_response: true,
            interrupt_response: true,
          },
        },
        output: {
          voice: REALTIME_VOICE,
          speed: 1.1,
        },
      },
      truncation: {
        type: "retention_ratio",
        retention_ratio: 0.8,
      },
    };

    const form = new FormData();
    form.append("sdp", new Blob([sdp], { type: "application/sdp" }), "offer.sdp");
    form.append("session", new Blob([JSON.stringify(session)], { type: "application/json" }), "session.json");

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
        let error = "OpenAI canlı ses bağlantısı kurulamadı.";
        if (status === 401) error = "OpenAI API anahtarı geçersiz.";
        if (status === 429) error = "OpenAI canlı ses kredisi veya kotası yetersiz.";
        if (response.status === 403) error = "Bu OpenAI projesinde Realtime API erişimi açık değil.";
        if (response.status === 404) error = `Canlı ses modeli bulunamadı. OPENAI_REALTIME_MODEL değerini ${REALTIME_MODEL} olarak kontrol edin.`;
        res.status(status).json({ error });
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
