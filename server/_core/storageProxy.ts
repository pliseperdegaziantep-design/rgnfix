import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      const label = encodeURIComponent(key.split("/").pop() || "RGNFIX");
      res
        .status(200)
        .type("image/svg+xml")
        .send(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" rx="28" fill="#f2f4f7"/><rect x="70" y="60" width="500" height="300" rx="24" fill="#ffffff" stroke="#a7b1bd" stroke-width="4"/><path d="M120 105h400M120 145h400M120 185h400M120 225h400M120 265h400M120 305h400" stroke="#0096d6" stroke-width="8" stroke-linecap="round"/><text x="320" y="375" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#0d1b2a">RGNFIX • Demo görsel • ${label}</text></svg>`);
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
