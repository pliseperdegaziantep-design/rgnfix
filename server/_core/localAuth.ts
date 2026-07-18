import type { Express, Request, Response } from "express";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { measurements, orders, users, type User } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "./cookies";

const LOCAL_ADMIN_OPEN_ID = "local-admin";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();
const scryptAsync = promisify(scryptCallback) as (
  password: string,
  salt: string,
  keyLength: number
) => Promise<Buffer>;

function setting(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function jwtConfigured() {
  return setting("JWT_SECRET").length >= 16;
}

function adminConfigured() {
  return Boolean(setting("ADMIN_EMAIL") && setting("ADMIN_PASSWORD") && jwtConfigured());
}

function secretKey(): Uint8Array {
  const secret = setting("JWT_SECRET");
  if (secret.length < 16) throw new Error("JWT_SECRET en az 16 karakter olmalı");
  return new TextEncoder().encode(secret);
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

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string | null) {
  try {
    if (!stored) return false;
    const [algorithm, salt, hashHex] = stored.split("$");
    if (algorithm !== "scrypt" || !salt || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length === 0) return false;
    const actual = await scryptAsync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function adminUser(): User {
  const now = new Date();
  return {
    id: -1,
    openId: LOCAL_ADMIN_OPEN_ID,
    name: setting("ADMIN_NAME") || "RGNFIX Yönetici",
    email: setting("ADMIN_EMAIL"),
    passwordHash: null,
    phone: null,
    address: null,
    city: null,
    loginMethod: "email-password",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

async function createToken(user: User): Promise<string> {
  return new SignJWT({
    userId: user.id,
    openId: user.openId,
    appId: "rgnfix",
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

function setSessionCookie(req: Request, res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    ...getSessionCookieOptions(req),
    maxAge: ONE_YEAR_MS,
  });
}

function clearSessionCookie(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
}

export async function getLocalAuthUser(req: Request): Promise<User | null> {
  if (!jwtConfigured()) return null;
  const token = parseCookieHeader(req.headers.cookie ?? "")[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.openId === LOCAL_ADMIN_OPEN_ID && adminConfigured()) return adminUser();

    const userId = typeof payload.userId === "number" ? payload.userId : Number(payload.userId);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = result[0];
    return user ? { ...user, passwordHash: null } : null;
  } catch {
    return null;
  }
}

async function requireCustomer(req: Request, res: Response) {
  const user = await getLocalAuthUser(req);
  if (!user || user.id <= 0 || user.role !== "user") {
    res.status(401).json({ error: "Müşteri girişi gerekli." });
    return null;
  }
  return user;
}

export function registerLocalAuthRoutes(app: Express) {
  app.get("/api/local-auth/status", async (_req, res) => {
    const db = await getDb();
    res.json({ configured: jwtConfigured(), registrationAvailable: Boolean(db && jwtConfigured()) });
  });

  app.post("/api/local-auth/register", async (req, res) => {
    try {
      if (!jwtConfigured()) {
        res.status(503).json({ error: "Üyelik sistemi için JWT_SECRET tanımlanmalı." });
        return;
      }
      if (isRateLimited(req)) {
        res.status(429).json({ error: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin." });
        return;
      }

      const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
      const email = normalizeEmail(req.body?.email);
      const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (name.length < 2) {
        res.status(400).json({ error: "Ad soyad en az 2 karakter olmalı." });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: "Geçerli bir e-posta adresi girin." });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Şifre en az 8 karakter olmalı." });
        return;
      }
      if (adminConfigured() && email === setting("ADMIN_EMAIL").toLowerCase()) {
        res.status(409).json({ error: "Bu e-posta adresi kullanılamaz." });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Üyelik için veritabanı bağlantısı gerekli." });
        return;
      }

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "Bu e-posta adresiyle daha önce hesap oluşturulmuş." });
        return;
      }

      const openId = `local-${nanoid(24)}`;
      await db.insert(users).values({
        openId,
        name,
        email,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        loginMethod: "email-password",
        role: "user",
        lastSignedIn: new Date(),
      });

      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      const user = result[0];
      if (!user) {
        res.status(500).json({ error: "Hesap oluşturuldu ancak oturum açılamadı." });
        return;
      }

      clearFailures(req);
      setSessionCookie(req, res, await createToken(user));
      res.status(201).json({ success: true, role: user.role });
    } catch (error) {
      console.error("[Auth] Registration failed:", error);
      res.status(500).json({ error: "Kayıt işlemi tamamlanamadı." });
    }
  });

  app.post("/api/local-auth/login", async (req, res) => {
    try {
      if (!jwtConfigured()) {
        res.status(503).json({ error: "Giriş sistemi için JWT_SECRET tanımlanmalı." });
        return;
      }
      if (isRateLimited(req)) {
        res.status(429).json({ error: "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin." });
        return;
      }

      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === "string" ? req.body.password : "";

      if (adminConfigured() && email === setting("ADMIN_EMAIL").toLowerCase()) {
        if (password !== setting("ADMIN_PASSWORD")) {
          recordFailure(req);
          res.status(401).json({ error: "E-posta veya şifre hatalı." });
          return;
        }
        clearFailures(req);
        const user = adminUser();
        setSessionCookie(req, res, await createToken(user));
        res.json({ success: true, role: "admin" });
        return;
      }

      const db = await getDb();
      if (!db) {
        recordFailure(req);
        res.status(401).json({ error: "E-posta veya şifre hatalı." });
        return;
      }

      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = result[0];
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        recordFailure(req);
        res.status(401).json({ error: "E-posta veya şifre hatalı." });
        return;
      }

      clearFailures(req);
      const signedInAt = new Date();
      await db.update(users).set({ lastSignedIn: signedInAt }).where(eq(users.id, user.id));
      setSessionCookie(req, res, await createToken({ ...user, lastSignedIn: signedInAt }));
      res.json({ success: true, role: user.role });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Giriş işlemi tamamlanamadı." });
    }
  });

  app.post("/api/local-auth/change-password", async (req, res) => {
    try {
      const sessionUser = await requireCustomer(req, res);
      if (!sessionUser) return;

      const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
      const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
      if (newPassword.length < 8) {
        res.status(400).json({ error: "Yeni şifre en az 8 karakter olmalı." });
        return;
      }
      if (currentPassword === newPassword) {
        res.status(400).json({ error: "Yeni şifre mevcut şifreden farklı olmalı." });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Veritabanı bağlantısı bulunamadı." });
        return;
      }
      const result = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
      const user = result[0];
      if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
        res.status(401).json({ error: "Mevcut şifre hatalı." });
        return;
      }

      await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, user.id));
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Password change failed:", error);
      res.status(500).json({ error: "Şifre değiştirilemedi." });
    }
  });

  app.get("/api/local-auth/export", async (req, res) => {
    try {
      const sessionUser = await requireCustomer(req, res);
      if (!sessionUser) return;
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Veritabanı bağlantısı bulunamadı." });
        return;
      }

      const [accountRows, orderRows, measurementRows] = await Promise.all([
        db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1),
        db.select().from(orders).where(eq(orders.userId, sessionUser.id)),
        db.select().from(measurements).where(eq(measurements.userId, sessionUser.id)),
      ]);
      const account = accountRows[0];
      const safeAccount = account ? { ...account, passwordHash: undefined } : null;
      const payload = {
        exportedAt: new Date().toISOString(),
        account: safeAccount,
        orders: orderRows,
        measurements: measurementRows,
      };

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=RGNFIX-verilerim-${new Date().toISOString().slice(0, 10)}.json`);
      res.send(JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error("[Auth] Data export failed:", error);
      res.status(500).json({ error: "Veriler hazırlanamadı." });
    }
  });

  app.delete("/api/local-auth/account", async (req, res) => {
    try {
      const sessionUser = await requireCustomer(req, res);
      if (!sessionUser) return;
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!password) {
        res.status(400).json({ error: "Hesabı silmek için şifrenizi girin." });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Veritabanı bağlantısı bulunamadı." });
        return;
      }
      const userRows = await db.select().from(users).where(eq(users.id, sessionUser.id)).limit(1);
      const user = userRows[0];
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: "Şifre hatalı." });
        return;
      }

      const userOrders = await db.select().from(orders).where(eq(orders.userId, sessionUser.id));
      const hasActiveOrder = userOrders.some(order => !["delivered", "cancelled"].includes(order.status));
      if (hasActiveOrder) {
        res.status(409).json({ error: "Devam eden siparişiniz bulunduğu için hesap şu anda silinemez. Sipariş tamamlandıktan veya iptal edildikten sonra tekrar deneyin." });
        return;
      }

      await db
        .update(orders)
        .set({
          userId: 0,
          customerName: "Silinen Kullanıcı",
          customerPhone: null,
          customerAddress: null,
          customerCity: null,
          customerNote: null,
        })
        .where(eq(orders.userId, sessionUser.id));
      await db.delete(measurements).where(eq(measurements.userId, sessionUser.id));
      await db.delete(users).where(eq(users.id, sessionUser.id));

      clearSessionCookie(req, res);
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Account deletion failed:", error);
      res.status(500).json({ error: "Hesap silinemedi." });
    }
  });

  app.post("/api/local-auth/logout", (req, res) => {
    clearSessionCookie(req, res);
    res.json({ success: true });
  });
}
