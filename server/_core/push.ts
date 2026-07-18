import type { Express } from "express";
import { importPKCS8, SignJWT } from "jose";
import { eq } from "drizzle-orm";
import { pushTokens } from "../../drizzle/schema";
import { getDb } from "../db";
import { getLocalAuthUser } from "./localAuth";

function setting(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function pushConfigured() {
  return Boolean(
    setting("FIREBASE_PROJECT_ID") &&
      setting("FIREBASE_CLIENT_EMAIL") &&
      setting("FIREBASE_PRIVATE_KEY")
  );
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFirebaseAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token;
  }

  const privateKey = setting("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
  const clientEmail = setting("FIREBASE_CLIENT_EMAIL");
  const key = await importPKCS8(privateKey, "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    throw new Error(`Firebase OAuth error ${response.status}: ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token: string; expires_in?: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

async function sendFirebaseMessage(options: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const projectId = setting("FIREBASE_PROJECT_ID");
  const accessToken = await getFirebaseAccessToken();
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token: options.token,
          notification: { title: options.title, body: options.body },
          data: options.data ?? {},
          android: {
            priority: "high",
            notification: { channel_id: "rgnfix_orders", sound: "default" },
          },
          apns: {
            payload: { aps: { sound: "default", badge: 1 } },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`FCM error ${response.status}: ${body}`);
  }
}

export async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  if (!pushConfigured()) return { sent: 0, skipped: true };
  const db = await getDb();
  if (!db) return { sent: 0, skipped: true };

  const tokens = await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  let sent = 0;
  for (const item of tokens.filter(token => token.enabled === 1)) {
    try {
      await sendFirebaseMessage({ token: item.token, title, body, data });
      sent += 1;
    } catch (error) {
      console.error(`[Push] Failed for token ${item.id}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("UNREGISTERED") || message.includes("INVALID_ARGUMENT")) {
        await db.update(pushTokens).set({ enabled: 0 }).where(eq(pushTokens.id, item.id));
      }
    }
  }
  return { sent, skipped: false };
}

export function registerPushRoutes(app: Express) {
  app.get("/api/push/status", async (req, res) => {
    const user = await getLocalAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Giriş gerekli." });
      return;
    }
    const db = await getDb();
    const tokens = db
      ? await db.select().from(pushTokens).where(eq(pushTokens.userId, user.id))
      : [];
    res.json({
      configured: pushConfigured(),
      registeredDevices: tokens.filter(token => token.enabled === 1).length,
    });
  });

  app.post("/api/push/register", async (req, res) => {
    const user = await getLocalAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Giriş gerekli." });
      return;
    }
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const platform = req.body?.platform;
    const deviceName = typeof req.body?.deviceName === "string" ? req.body.deviceName.slice(0, 160) : null;
    if (!token || !["android", "ios", "web"].includes(platform)) {
      res.status(400).json({ error: "Geçersiz bildirim cihaz bilgisi." });
      return;
    }
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Veritabanı bağlantısı bulunamadı." });
      return;
    }

    await db.insert(pushTokens).values({
      userId: user.id,
      token,
      platform,
      deviceName,
      enabled: 1,
    }).onDuplicateKeyUpdate({
      set: { userId: user.id, platform, deviceName, enabled: 1 },
    });
    res.json({ success: true, configured: pushConfigured() });
  });

  app.delete("/api/push/unregister", async (req, res) => {
    const user = await getLocalAuthUser(req);
    if (!user) {
      res.status(401).json({ error: "Giriş gerekli." });
      return;
    }
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const db = await getDb();
    if (!db || !token) {
      res.json({ success: true });
      return;
    }
    await db.update(pushTokens).set({ enabled: 0 }).where(eq(pushTokens.token, token));
    res.json({ success: true });
  });
}
