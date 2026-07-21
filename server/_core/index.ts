import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerAdminRoutes } from "./adminRoutes";
import { registerPushRoutes } from "./push";
import { registerUploadRoutes } from "./uploadRoutes";
import { registerOpenAiSpeechRoutes } from "./openAiSpeech";
import { registerRealtimeVoiceRoutes } from "./realtimeVoice";
import { registerDataCaptureRoutes } from "./dataCapture";
import { ensureAppSchema } from "../db";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getLLMStatus, invokeLLM, toPublicLLMError } from "./llm";

async function startServer() {
  await ensureAppSchema();

  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader(
      "Permissions-Policy",
      "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), browsing-topics=()"
    );
    if (req.path.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store, private, max-age=0");
      res.setHeader("Pragma", "no-cache");
    }
    next();
  });

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "rgnfix", timestamp: new Date().toISOString() });
  });

  app.get("/api/ai/status", (_req, res) => {
    res.json(getLLMStatus());
  });

  app.get("/api/ai/test", async (_req, res) => {
    const status = getLLMStatus();
    if (!status.configured) {
      res.status(503).json({ ok: false, ...status });
      return;
    }

    try {
      const response = await invokeLLM({
        messages: [{ role: "user", content: "Sadece TAMAM yaz." }],
      });
      const content = response.choices?.[0]?.message?.content;
      res.json({
        ok: true,
        provider: status.provider,
        model: response.model || status.model,
        response: typeof content === "string" ? content : "TAMAM",
      });
    } catch (error) {
      console.error("[AI] Connection test failed:", error);
      const rawMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const publicError = status.provider === "openai"
        ? rawMessage.includes("401")
          ? "OpenAI API anahtarı geçersiz veya iptal edilmiş. Yeni bir proje API anahtarı oluşturup Hostinger'a kaydedin."
          : rawMessage.includes("429") || rawMessage.includes("quota") || rawMessage.includes("billing") || rawMessage.includes("credit")
            ? "OpenAI API hesabında kullanılabilir kredi, kota veya aktif faturalandırma bulunmuyor."
            : rawMessage.includes("404") || rawMessage.includes("model")
              ? `OpenAI modeli kullanılamıyor. Hostinger'daki OPENAI_MODEL değerini gpt-5-mini olarak kontrol edin.`
              : rawMessage.includes("unsupported parameter") || rawMessage.includes("max_tokens")
                ? "OpenAI modeliyle uyumsuz eski bir istek parametresi kullanıldı. Uygulamayı en son sürüme yeniden dağıtın."
                : "OpenAI API bağlantısı başarısız oldu. Ayrıntı Hostinger çalışma zamanı günlüklerine kaydedildi."
        : toPublicLLMError(error);
      res.status(502).json({
        ok: false,
        provider: status.provider,
        model: status.model,
        error: publicError,
      });
    }
  });

  registerOpenAiSpeechRoutes(app);
  registerRealtimeVoiceRoutes(app);
  registerStorageProxy(app);
  registerLocalAuthRoutes(app);
  registerPushRoutes(app);
  registerUploadRoutes(app);
  registerDataCaptureRoutes(app);
  registerAdminRoutes(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
  });
}

startServer().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});