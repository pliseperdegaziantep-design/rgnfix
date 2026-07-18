import type { Express, Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { getSessionCookieOptions } from "./cookies";

const LOCAL_ADMIN_OPEN_ID = "local-admin";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function setting(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function secretKey(): Uint8Array {
  const secret = setting("JWT_SECRET");
  if (secret.length < 16) {
    throw new Error("JWT_SECRET en az 16 karakter olmalı");
  }
  return new TextEncoder().encode(secret);
}

function configured(): boolean {
  return Boolean(setting("ADMIN_EMAIL") && setting("ADMIN_PASSWORD") && setting("JWT_SECRET"));
}

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isRateLimited(req: Request): boolean {
  const key = clientKey(req);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(req: Request) {
  const key = clientKey(req);
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
}

function clearFailures(req: Request) {
  attempts.delete(clientKey(req));
}

async function createToken(): Promise<string> {
  const name = setting("ADMIN_NAME") || "RGNFIX Yönetici";
  return new SignJWT({
    openId: LOCAL_ADMIN_OPEN_ID,
    appId: "rgnfix",
    name,
    email: setting("ADMIN_EMAIL"),
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function getLocalAuthUser(req: Request): Promise<User | null> {
  if (!configured()) return null;
  const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.openId !== LOCAL_ADMIN_OPEN_ID) return null;
    const now = new Date();
    return {
      id: -1,
      openId: LOCAL_ADMIN_OPEN_ID,
      name: typeof payload.name === "string" ? payload.name : "RGNFIX Yönetici",
      email: typeof payload.email === "string" ? payload.email : setting("ADMIN_EMAIL"),
      phone: null,
      address: null,
      city: null,
      loginMethod: "email-password",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
  } catch {
    return null;
  }
}

export function registerLocalAuthRoutes(app: Express) {
  app.get("/api/local-auth/status", (_req, res) => {
    res.json({ configured: configured() });
  });

  app.post("/api/local-auth/login", async (req, res) => {
    if (!configured()) {
      res.status(503).json({ error: "Giriş sistemi henüz yapılandırılmadı." });
      return;
    }
    if (isRateLimited(req)) {
      res.status(429).json({ error: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin." });
      return;
    }

    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const validEmail = email === setting("ADMIN_EMAIL").toLowerCase();
    const validPassword = password === setting("ADMIN_PASSWORD");

    if (!validEmail || !validPassword) {
      recordFailure(req);
      res.status(401).json({ error: "E-posta veya şifre hatalı." });
      return;
    }

    clearFailures(req);
    const token = await createToken();
    res.cookie(COOKIE_NAME, token, {
      ...getSessionCookieOptions(req),
      maxAge: ONE_YEAR_MS,
    });
    res.json({ success: true });
  });

  app.post("/api/local-auth/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
    res.json({ success: true });
  });
}
