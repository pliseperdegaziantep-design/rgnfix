import type { Express, Request, Response } from "express";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { measurements, orders, users, type User } from "../../drizzle/schema";
import { getDb } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { appBaseUrl, emailShell, mailConfigured, sendTransactionalEmail } from "./mailer";

const LOCAL_ADMIN_OPEN_ID = "local-admin";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;
const VERIFICATION_LIFETIME_MS = 24 * 60 * 60 * 1000;
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

function createActionToken() {
  return randomBytes(32).toString("hex");
}

function hashActionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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
    emailVerifiedAt: now,
    verificationTokenHash: null,
    verificationTokenExpiresAt: null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    termsAcceptedAt: now,
    privacyAcceptedAt: now,
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

async function sendVerification(email: string, name: string | null, token: string) {
  const url = `${appBaseUrl()}/eposta-dogrula?token=${encodeURIComponent(token)}`;
  return sendTransactionalEmail({
    to: email,
    subject: "RGNFIX e-posta adresinizi doğrulayın",
    html: emailShell(
      "E-posta adresinizi doğrulayın",
      `<p>Merhaba ${name || ""}, RGNFIX hesabınızı kullanmaya başlamak için e-posta adresinizi doğrulayın.</p><p>Bu bağlantı 24 saat geçerlidir.</p>`,
      "E-postamı Doğrula",
      url
    ),
  });
}

async function sendPasswordReset(email: string, name: string | null, token: string) {
  const url = `${appBaseUrl()}/sifre-yenile?token=${encodeURIComponent(token)}`;
  return sendTransactionalEmail({
    to: email,
    subject: "RGNFIX şifre yenileme",
    html: emailShell(
      "Şifrenizi yenileyin",
      `<p>Merhaba ${name || ""}, RGNFIX hesabınız için şifre yenileme talebi aldık.</p><p>Bu bağlantı 1 saat geçerlidir.</p>`,
      "Yeni Şifre Belirle",
      url
    ),
  });
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
    return user
      ? {
          ...user,
          passwordHash: null,
          verificationTokenHash: null,
          resetTokenHash: null,
        }
      : null;
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
    res.json({
      configured: jwtConfigured(),
      registrationAvailable: Boolean(db && jwtConfigured()),
      emailVerificationEnabled: mailConfigured(),
    });
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
      const termsAccepted = req.body?.termsAccepted === true;
      const privacyAccepted = req.body?.privacyAccepted === true;

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
      if (!termsAccepted || !privacyAccepted) {
        res.status(400).json({ error: "Hesap oluşturmak için Kullanım Koşulları ve Gizlilik Politikası kabul edilmelidir." });
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

      const now = new Date();
      const verificationRequired = mailConfigured();
      const verificationToken = verificationRequired ? createActionToken() : null;
      const openId = `local-${nanoid(24)}`;
      await db.insert(users).values({
        openId,
        name,
        email,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        emailVerifiedAt: verificationRequired ? null : now,
        verificationTokenHash: verificationToken ? hashActionToken(verificationToken) : null,
        verificationTokenExpiresAt: verificationToken ? new Date(Date.now() + VERIFICATION_LIFETIME_MS) : null,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        loginMethod: "email-password",
        role: "user",
        lastSignedIn: now,
      });

      const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
      let user = result[0];
      if (!user) {
        res.status(500).json({ error: "Hesap oluşturuldu ancak oturum açılamadı." });
        return;
      }

      if (verificationToken) {
        try {
          await sendVerification(email, name, verificationToken);
          clearFailures(req);
          res.status(201).json({ success: true, role: user.role, verificationRequired: true });
          return;
        } catch (error) {
          console.error("[Auth] Verification email failed; enabling account temporarily:", error);
          await db
            .update(users)
            .set({
              emailVerifiedAt: now,
              verificationTokenHash: null,
              verificationTokenExpiresAt: null,
            })
            .where(eq(users.id, user.id));
          user = { ...user, emailVerifiedAt: now, verificationTokenHash: null, verificationTokenExpiresAt: null };
        }
      }

      clearFailures(req);
      setSessionCookie(req, res, await createToken(user));
      res.status(201).json({ success: true, role: user.role, verificationRequired: false });
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
      if (mailConfigured() && !user.emailVerifiedAt) {
        res.status(403).json({
          error: "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin.",
          emailVerificationRequired: true,
        });
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

  app.post("/api/local-auth/resend-verification", async (req, res) => {
    try {
      const email = normalizeEmail(req.body?.email);
      if (!mailConfigured()) {
        res.json({ success: true });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.json({ success: true });
        return;
      }
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];
      if (!user || user.emailVerifiedAt) {
        res.json({ success: true });
        return;
      }

      const token = createActionToken();
      await db
        .update(users)
        .set({
          verificationTokenHash: hashActionToken(token),
          verificationTokenExpiresAt: new Date(Date.now() + VERIFICATION_LIFETIME_MS),
        })
        .where(eq(users.id, user.id));
      await sendVerification(email, user.name, token);
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Verification resend failed:", error);
      res.json({ success: true });
    }
  });

  app.get("/api/local-auth/verify-email", async (req, res) => {
    try {
      const token = typeof req.query.token === "string" ? req.query.token : "";
      if (!token) {
        res.status(400).json({ error: "Doğrulama bağlantısı geçersiz." });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Veritabanı bağlantısı bulunamadı." });
        return;
      }
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.verificationTokenHash, hashActionToken(token)))
        .limit(1);
      const user = rows[0];
      if (!user || !user.verificationTokenExpiresAt || user.verificationTokenExpiresAt.getTime() < Date.now()) {
        res.status(400).json({ error: "Doğrulama bağlantısının süresi dolmuş veya bağlantı geçersiz." });
        return;
      }

      await db
        .update(users)
        .set({
          emailVerifiedAt: new Date(),
          verificationTokenHash: null,
          verificationTokenExpiresAt: null,
        })
        .where(eq(users.id, user.id));
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Email verification failed:", error);
      res.status(500).json({ error: "E-posta doğrulanamadı." });
    }
  });

  app.post("/api/local-auth/forgot-password", async (req, res) => {
    const generic = { success: true, message: "Bu e-posta kayıtlıysa şifre yenileme bağlantısı gönderildi." };
    try {
      const email = normalizeEmail(req.body?.email);
      if (!mailConfigured()) {
        res.status(503).json({ error: "Şifre yenileme e-posta hizmeti henüz aktif değil." });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.json(generic);
        return;
      }
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];
      if (!user || !user.passwordHash) {
        res.json(generic);
        return;
      }

      const token = createActionToken();
      await db
        .update(users)
        .set({
          resetTokenHash: hashActionToken(token),
          resetTokenExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
        })
        .where(eq(users.id, user.id));
      await sendPasswordReset(email, user.name, token);
      res.json(generic);
    } catch (error) {
      console.error("[Auth] Forgot password failed:", error);
      res.json(generic);
    }
  });

  app.post("/api/local-auth/reset-password", async (req, res) => {
    try {
      const token = typeof req.body?.token === "string" ? req.body.token : "";
      const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
      if (!token || newPassword.length < 8) {
        res.status(400).json({ error: "Bağlantı geçersiz veya şifre en az 8 karakter değil." });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Veritabanı bağlantısı bulunamadı." });
        return;
      }
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.resetTokenHash, hashActionToken(token)))
        .limit(1);
      const user = rows[0];
      if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
        res.status(400).json({ error: "Şifre yenileme bağlantısının süresi dolmuş veya bağlantı geçersiz." });
        return;
      }

      await db
        .update(users)
        .set({
          passwordHash: await hashPassword(newPassword),
          resetTokenHash: null,
          resetTokenExpiresAt: null,
        })
        .where(eq(users.id, user.id));
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Password reset failed:", error);
      res.status(500).json({ error: "Şifre yenilenemedi." });
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
      const safeAccount = account
        ? {
            id: account.id,
            name: account.name,
            email: account.email,
            phone: account.phone,
            address: account.address,
            city: account.city,
            emailVerifiedAt: account.emailVerifiedAt,
            termsAcceptedAt: account.termsAcceptedAt,
            privacyAcceptedAt: account.privacyAcceptedAt,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            lastSignedIn: account.lastSignedIn,
          }
        : null;
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
