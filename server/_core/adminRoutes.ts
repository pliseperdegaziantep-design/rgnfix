import type { Express, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { orders } from "../../drizzle/schema";
import { demoOrders } from "../sampleData";
import { getDb } from "../db";
import { getLocalAuthUser } from "./localAuth";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "production"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled";

const ORDER_STATUSES = new Set<OrderStatus>([
  "pending",
  "confirmed",
  "production",
  "preparing",
  "shipping",
  "delivered",
  "cancelled",
]);

async function requireAdmin(req: Request, res: Response) {
  const user = await getLocalAuthUser(req);
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Yönetici girişi gerekli." });
    return null;
  }
  return user;
}

export function registerAdminRoutes(app: Express) {
  app.get("/api/admin/orders", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const db = await getDb();
    if (!db) {
      res.json({ orders: demoOrders, demoMode: true });
      return;
    }

    const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
    res.json({ orders: result, demoMode: false });
  });

  app.patch("/api/admin/orders/:id/status", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const id = Number.parseInt(req.params.id, 10);
    const rawStatus = typeof req.body?.status === "string" ? req.body.status : "";

    if (!Number.isInteger(id) || id <= 0 || !ORDER_STATUSES.has(rawStatus as OrderStatus)) {
      res.status(400).json({ error: "Geçersiz sipariş veya durum." });
      return;
    }
    const status = rawStatus as OrderStatus;

    const db = await getDb();
    if (!db) {
      const order = demoOrders.find(item => Number(item.id) === id);
      if (!order) {
        res.status(404).json({ error: "Sipariş bulunamadı." });
        return;
      }
      (order as { status: OrderStatus; updatedAt: Date }).status = status;
      (order as { status: OrderStatus; updatedAt: Date }).updatedAt = new Date();
      res.json({ success: true, demoMode: true });
      return;
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id));

    res.json({ success: true, demoMode: false });
  });
}
