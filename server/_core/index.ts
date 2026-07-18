import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerLocalAuthRoutes } from "./localAuth";
import { registerAdminRoutes } from "./adminRoutes";
import { registerPushRoutes } from "./push";
import { ensureAppSchema } from "../db";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getLLMStatus, invokeLLM, toPublicLLMError } from "./llm";

async function startServer() {
  await ensureAppSchema();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
        max_tokens: 12,
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
      res.status(502).json({
        ok: false,
        provider: status.provider,
        model: status.model,
        error: toPublicLLMError(error),
      });
    }
  });

  registerStorageProxy(app);
  registerLocalAuthRoutes(app);
  registerPushRoutes(app);
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
