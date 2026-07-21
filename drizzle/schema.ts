import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  verificationTokenHash: varchar("verificationTokenHash", { length: 64 }),
  verificationTokenExpiresAt: timestamp("verificationTokenExpiresAt"),
  resetTokenHash: varchar("resetTokenHash", { length: 64 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  privacyAcceptedAt: timestamp("privacyAcceptedAt"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const fabrics = mysqlTable("fabrics", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  privacy: int("privacy"),
  sunControl: int("sunControl"),
  heatInsulation: int("heatInsulation"),
  cleaning: int("cleaning"),
  durability: int("durability"),
  blackout: int("blackout"),
  usageArea: text("usageArea"),
  advantages: text("advantages"),
  disadvantages: text("disadvantages"),
  pricePerSqm: decimal("pricePerSqm", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  colors: json("colors"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Fabric = typeof fabrics.$inferSelect;
export type InsertFabric = typeof fabrics.$inferInsert;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "confirmed", "production", "preparing", "shipping", "delivered", "cancelled"]).default("pending").notNull(),
  fabricId: int("fabricId"),
  fabricName: varchar("fabricName", { length: 100 }),
  profileColor: varchar("profileColor", { length: 50 }),
  fabricColor: varchar("fabricColor", { length: 50 }),
  mountType: varchar("mountType", { length: 50 }),
  caseType: varchar("caseType", { length: 20 }),
  width: decimal("width", { precision: 8, scale: 2 }),
  height: decimal("height", { precision: 8, scale: 2 }),
  quantity: int("quantity").default(1),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  mountingPrice: decimal("mountingPrice", { precision: 10, scale: 2 }),
  shippingPrice: decimal("shippingPrice", { precision: 10, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  customerName: varchar("customerName", { length: 200 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  customerAddress: text("customerAddress"),
  customerCity: varchar("customerCity", { length: 100 }),
  customerNote: text("customerNote"),
  measurementRecordingUrl: text("measurementRecordingUrl"),
  measurementRecordingConsentAt: timestamp("measurementRecordingConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const dealers = mysqlTable("dealers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  district: varchar("district", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 320 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = typeof dealers.$inferInsert;

export const measurements = mysqlTable("measurements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }),
  windowType: varchar("windowType", { length: 50 }),
  mountType: varchar("mountType", { length: 50 }),
  width: decimal("width", { precision: 8, scale: 2 }),
  height: decimal("height", { precision: 8, scale: 2 }),
  windowCount: int("windowCount").default(1),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = typeof measurements.$inferInsert;

export const appDataRecords = mysqlTable("appDataRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  recordType: varchar("recordType", { length: 40 }).notNull(),
  payload: json("payload").notNull(),
  ipHash: varchar("ipHash", { length: 64 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AppDataRecord = typeof appDataRecords.$inferSelect;
export type InsertAppDataRecord = typeof appDataRecords.$inferInsert;

export const pushTokens = mysqlTable("pushTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  platform: mysqlEnum("platform", ["android", "ios", "web"]).notNull(),
  deviceName: varchar("deviceName", { length: 160 }),
  enabled: int("enabled").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;