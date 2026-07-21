import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let schemaChecked = false;
let lastConnectionError = "";

function getMysqlError(error: unknown) {
  const candidate = error as {
    code?: string;
    errno?: number;
    message?: string;
    cause?: { code?: string; errno?: number; message?: string };
  };
  return {
    code: candidate.code || candidate.cause?.code,
    errno: candidate.errno || candidate.cause?.errno,
    message: candidate.cause?.message || candidate.message || String(error),
  };
}

function normalizeDatabaseUrl(rawValue: string) {
  const value = rawValue.trim();
  const url = new URL(value);
  if (process.env.NODE_ENV === "production" && /\.hstgr\.io$/i.test(url.hostname)) {
    url.hostname = "127.0.0.1";
    url.port = "3306";
    console.log("[Database] Hostinger local MySQL connection selected");
  }
  return url.toString();
}

export async function getDb() {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    lastConnectionError = "DATABASE_URL tanımlı değil.";
    return null;
  }
  if (_db) return _db;

  try {
    const connectionUrl = normalizeDatabaseUrl(rawUrl);
    const candidate = drizzle(connectionUrl);
    await candidate.execute(sql.raw("SELECT 1"));
    _db = candidate;
    lastConnectionError = "";
    console.log("[Database] Connection established");
  } catch (error) {
    const mysqlError = getMysqlError(error);
    lastConnectionError = `${mysqlError.code || mysqlError.errno || "UNKNOWN"}: ${mysqlError.message}`;
    console.error("[Database] Connection failed:", lastConnectionError);
    _db = null;
  }
  return _db;
}

export function getDatabaseStatus() {
  return {
    configured: Boolean(process.env.DATABASE_URL?.trim()),
    connected: Boolean(_db),
    error: lastConnectionError || null,
  };
}

function isDuplicateColumnError(error: unknown) {
  const mysqlError = getMysqlError(error);
  return mysqlError.code === "ER_DUP_FIELDNAME" || mysqlError.errno === 1060 || mysqlError.message.includes("Duplicate column");
}

async function executeSchemaStatement(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, statement: string, label: string) {
  try {
    await db.execute(sql.raw(statement));
    console.log(`[Database] ${label} ready`);
    return true;
  } catch (error) {
    const mysqlError = getMysqlError(error);
    console.error(`[Database] ${label} failed (${mysqlError.code || mysqlError.errno || "unknown"}):`, mysqlError.message);
    return false;
  }
}

async function addColumn(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, statement: string, label: string) {
  try {
    await db.execute(sql.raw(statement));
    console.log(`[Database] ${label} column added`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      const mysqlError = getMysqlError(error);
      console.warn(`[Database] ${label} migration skipped (${mysqlError.code || mysqlError.errno || "unknown"}):`, mysqlError.message);
    }
  }
}

export async function ensureAppSchema() {
  if (schemaChecked) return;
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Schema bootstrap skipped: database not available");
    return;
  }

  const baseTables = [
    `CREATE TABLE IF NOT EXISTS users (
      id int NOT NULL AUTO_INCREMENT, openId varchar(64) NOT NULL, name text NULL, email varchar(320) NULL,
      passwordHash varchar(255) NULL, emailVerifiedAt timestamp NULL, verificationTokenHash varchar(64) NULL,
      verificationTokenExpiresAt timestamp NULL, resetTokenHash varchar(64) NULL, resetTokenExpiresAt timestamp NULL,
      termsAcceptedAt timestamp NULL, privacyAcceptedAt timestamp NULL, phone varchar(20) NULL, address text NULL,
      city varchar(100) NULL, loginMethod varchar(64) NULL, role enum('user','admin') NOT NULL DEFAULT 'user',
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      lastSignedIn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id), UNIQUE KEY users_openId_unique (openId), KEY users_email_index (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS fabrics (
      id int NOT NULL AUTO_INCREMENT, name varchar(100) NOT NULL, slug varchar(100) NOT NULL, description text NULL,
      privacy int NULL, sunControl int NULL, heatInsulation int NULL, cleaning int NULL, durability int NULL, blackout int NULL,
      usageArea text NULL, advantages text NULL, disadvantages text NULL, pricePerSqm decimal(10,2) NOT NULL,
      imageUrl text NULL, colors json NULL, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id), UNIQUE KEY fabrics_slug_unique (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS orders (
      id int NOT NULL AUTO_INCREMENT, userId int NOT NULL DEFAULT 0, orderNumber varchar(20) NOT NULL,
      status enum('pending','confirmed','production','preparing','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
      fabricId int NULL, fabricName varchar(100) NULL, profileColor varchar(50) NULL, fabricColor varchar(50) NULL,
      mountType varchar(50) NULL, caseType varchar(20) NULL, width decimal(8,2) NULL, height decimal(8,2) NULL,
      quantity int NULL DEFAULT 1, unitPrice decimal(10,2) NULL, mountingPrice decimal(10,2) NULL,
      shippingPrice decimal(10,2) NULL, totalPrice decimal(10,2) NOT NULL, customerName varchar(200) NULL,
      customerPhone varchar(20) NULL, customerAddress text NULL, customerCity varchar(100) NULL, customerNote text NULL,
      measurementRecordingUrl text NULL, measurementRecordingConsentAt timestamp NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id), UNIQUE KEY orders_orderNumber_unique (orderNumber), KEY orders_userId_index (userId), KEY orders_createdAt_index (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS dealers (
      id int NOT NULL AUTO_INCREMENT, name varchar(200) NOT NULL, address text NULL, city varchar(100) NULL,
      district varchar(100) NULL, phone varchar(20) NULL, whatsapp varchar(20) NULL, email varchar(320) NULL,
      lat decimal(10,7) NULL, lng decimal(10,7) NULL, isActive int NULL DEFAULT 1,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS measurements (
      id int NOT NULL AUTO_INCREMENT, userId int NULL, sessionId varchar(64) NULL, windowType varchar(50) NULL,
      mountType varchar(50) NULL, width decimal(8,2) NULL, height decimal(8,2) NULL, windowCount int NULL DEFAULT 1,
      notes text NULL, createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id),
      KEY measurements_userId_index (userId), KEY measurements_sessionId_index (sessionId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS appDataRecords (
      id int NOT NULL AUTO_INCREMENT, userId int NULL, sessionId varchar(64) NOT NULL, recordType varchar(40) NOT NULL,
      payload json NOT NULL, ipHash varchar(64) NULL, userAgent varchar(500) NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (id),
      KEY appDataRecords_sessionId_index (sessionId), KEY appDataRecords_recordType_index (recordType), KEY appDataRecords_createdAt_index (createdAt)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    `CREATE TABLE IF NOT EXISTS pushTokens (
      id int NOT NULL AUTO_INCREMENT, userId int NOT NULL, token varchar(512) NOT NULL,
      platform enum('android','ios','web') NOT NULL, deviceName varchar(160) NULL, enabled int NOT NULL DEFAULT 1,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id), UNIQUE KEY pushTokens_token_unique (token), KEY pushTokens_userId_index (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ];

  for (const [index, statement] of baseTables.entries()) {
    await executeSchemaStatement(db, statement, `base table ${index + 1}`);
  }

  await addColumn(db, "ALTER TABLE users ADD COLUMN passwordHash varchar(255) NULL", "users.passwordHash");
  await addColumn(db, "ALTER TABLE users ADD COLUMN emailVerifiedAt timestamp NULL", "users.emailVerifiedAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN verificationTokenHash varchar(64) NULL", "users.verificationTokenHash");
  await addColumn(db, "ALTER TABLE users ADD COLUMN verificationTokenExpiresAt timestamp NULL", "users.verificationTokenExpiresAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN resetTokenHash varchar(64) NULL", "users.resetTokenHash");
  await addColumn(db, "ALTER TABLE users ADD COLUMN resetTokenExpiresAt timestamp NULL", "users.resetTokenExpiresAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN termsAcceptedAt timestamp NULL", "users.termsAcceptedAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN privacyAcceptedAt timestamp NULL", "users.privacyAcceptedAt");
  await addColumn(db, "ALTER TABLE orders ADD COLUMN measurementRecordingUrl text NULL", "orders.measurementRecordingUrl");
  await addColumn(db, "ALTER TABLE orders ADD COLUMN measurementRecordingConsentAt timestamp NULL", "orders.measurementRecordingConsentAt");

  try {
    await db.execute(sql.raw(`UPDATE users SET emailVerifiedAt = COALESCE(emailVerifiedAt, createdAt), termsAcceptedAt = COALESCE(termsAcceptedAt, createdAt), privacyAcceptedAt = COALESCE(privacyAcceptedAt, createdAt) WHERE passwordHash IS NOT NULL AND (emailVerifiedAt IS NULL OR termsAcceptedAt IS NULL OR privacyAcceptedAt IS NULL)`));
  } catch (error) {
    console.warn("[Database] Existing account consent backfill skipped:", getMysqlError(error).message);
  }

  schemaChecked = true;
  console.log("[Database] Schema bootstrap completed");
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const normalized = user[field] ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
