import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { getLocalAuthUser } from "./localAuth";

async function requireAdmin(req: Request, res: Response) {
  const user = await getLocalAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Yönetici girişi gerekli." });
    return null;
  }
  return user;
}

export function registerBusinessRoutes(app: Express) {
  app.get("/api/orders/track/:orderNumber", async (req, res) => {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!/^\d{5,10}$/.test(orderNumber)) {
      res.status(400).json({ error: "Geçerli bir sipariş numarası girin." });
      return;
    }
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Sipariş sorgulama servisi geçici olarak kullanılamıyor." });
      return;
    }
    const [rows] = await db.execute(sql`
      SELECT orderNumber, status, fabricName, fabricColor, profileColor, mountType,
             caseType, width, height, quantity, measurements, totalPrice, createdAt, updatedAt
      FROM orders
      WHERE orderNumber = ${orderNumber}
      LIMIT 1
    `);
    const result = Array.isArray(rows) ? rows[0] : undefined;
    if (!result) {
      res.status(404).json({ error: "Bu numarayla kayıtlı sipariş bulunamadı." });
      return;
    }
    res.json({ order: result });
  });

  app.get("/api/prices", async (_req, res) => {
    const db = await getDb();
    if (!db) {
      res.json({ prices: [
        { seriesId: "nova", seriesName: "Nova", basePrice: 485, adhesiveSurcharge: 65 },
        { seriesId: "neo-fashion", seriesName: "Neo Fashion", basePrice: 545, adhesiveSurcharge: 65 },
        { seriesId: "nano-clean", seriesName: "Nano Clean", basePrice: 545, adhesiveSurcharge: 65 },
        { seriesId: "nano-insulation", seriesName: "Nano Insulation", basePrice: 645, adhesiveSurcharge: 65 },
        { seriesId: "nano-pro", seriesName: "Nano Pro", basePrice: 845, adhesiveSurcharge: 65 },
        { seriesId: "honeycomb", seriesName: "Honeycomb", basePrice: 1000, adhesiveSurcharge: 65 },
      ], demoMode: true });
      return;
    }
    const [rows] = await db.execute(sql`SELECT seriesId, seriesName, basePrice, adhesiveSurcharge, updatedAt FROM priceSettings ORDER BY id`);
    res.json({ prices: rows, demoMode: false });
  });

  app.patch("/api/admin/prices/:seriesId", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const seriesId = String(req.params.seriesId || "").trim();
    const basePrice = Number(req.body?.basePrice);
    const adhesiveSurcharge = Number(req.body?.adhesiveSurcharge);
    if (!seriesId || !Number.isFinite(basePrice) || basePrice <= 0 || !Number.isFinite(adhesiveSurcharge) || adhesiveSurcharge < 0) {
      res.status(400).json({ error: "Geçerli fiyat bilgileri girin." });
      return;
    }
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Veritabanı bağlantısı hazır değil." });
      return;
    }
    await db.execute(sql`UPDATE priceSettings SET basePrice = ${basePrice.toFixed(2)}, adhesiveSurcharge = ${adhesiveSurcharge.toFixed(2)} WHERE seriesId = ${seriesId}`);
    res.json({ success: true });
  });
}
