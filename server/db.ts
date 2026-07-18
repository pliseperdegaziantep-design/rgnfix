import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let schemaChecked = false;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function isDuplicateColumnError(error: unknown) {
  const candidate = error as {
    code?: string;
    errno?: number;
    message?: string;
    cause?: { code?: string; errno?: number; message?: string };
  };
  return (
    candidate.code === "ER_DUP_FIELDNAME" ||
    candidate.errno === 1060 ||
    candidate.cause?.code === "ER_DUP_FIELDNAME" ||
    candidate.cause?.errno === 1060 ||
    candidate.message?.includes("Duplicate column") ||
    candidate.cause?.message?.includes("Duplicate column")
  );
}

async function addColumn(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, statement: string, label: string) {
  try {
    await db.execute(sql.raw(statement));
    console.log(`[Database] ${label} column added`);
  } catch (error) {
    if (!isDuplicateColumnError(error)) {
      console.error(`[Database] Failed to add ${label}:`, error);
      throw error;
    }
  }
}

/**
 * Hostinger'da ayrıca terminal çalıştırmaya gerek kalmadan küçük, geriye uyumlu
 * şema güncellemelerini uygular. Var olan kayıtları değiştirmez; eski yerel
 * hesapları e-posta doğrulanmış ve mevcut koşulları kabul etmiş olarak işaretler.
 */
export async function ensureAppSchema() {
  if (schemaChecked) return;
  const db = await getDb();
  if (!db) return;

  await addColumn(db, "ALTER TABLE users ADD COLUMN passwordHash varchar(255) NULL", "users.passwordHash");
  await addColumn(db, "ALTER TABLE users ADD COLUMN emailVerifiedAt timestamp NULL", "users.emailVerifiedAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN verificationTokenHash varchar(64) NULL", "users.verificationTokenHash");
  await addColumn(db, "ALTER TABLE users ADD COLUMN verificationTokenExpiresAt timestamp NULL", "users.verificationTokenExpiresAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN resetTokenHash varchar(64) NULL", "users.resetTokenHash");
  await addColumn(db, "ALTER TABLE users ADD COLUMN resetTokenExpiresAt timestamp NULL", "users.resetTokenExpiresAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN termsAcceptedAt timestamp NULL", "users.termsAcceptedAt");
  await addColumn(db, "ALTER TABLE users ADD COLUMN privacyAcceptedAt timestamp NULL", "users.privacyAcceptedAt");

  try {
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS pushTokens (
        id int NOT NULL AUTO_INCREMENT,
        userId int NOT NULL,
        token varchar(512) NOT NULL,
        platform enum('android','ios','web') NOT NULL,
        deviceName varchar(160) NULL,
        enabled int NOT NULL DEFAULT 1,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY pushTokens_token_unique (token),
        KEY pushTokens_userId_index (userId)
      )
    `));
  } catch (error) {
    console.error("[Database] Failed to create pushTokens table:", error);
    throw error;
  }

  try {
    await db.execute(sql.raw(`
      UPDATE users
      SET
        emailVerifiedAt = COALESCE(emailVerifiedAt, createdAt),
        termsAcceptedAt = COALESCE(termsAcceptedAt, createdAt),
        privacyAcceptedAt = COALESCE(privacyAcceptedAt, createdAt)
      WHERE passwordHash IS NOT NULL
        AND (emailVerifiedAt IS NULL OR termsAcceptedAt IS NULL OR privacyAcceptedAt IS NULL)
    `));
  } catch (error) {
    console.warn("[Database] Existing account consent backfill skipped:", error);
  }

  schemaChecked = true;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
