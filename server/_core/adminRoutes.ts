import type { Express, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { orders } from "../../drizzle/schema";
import { demoOrders } from "../sampleData";
import { getDb } from "../db";
import { getLocalAuthUser } from "./localAuth";
import { sendPushToUser } from "./push";

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

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Onay Bekliyor",
  confirmed: "Onaylandı",
  production: "Üretimde",
  preparing: "Hazırlanıyor",
  shipping: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

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

  app.patch("/api/admin/orders/:id", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "Geçersiz sipariş." });
      return;
    }

    const textFields = [
      "fabricName", "fabricColor", "profileColor", "mountType", "caseType",
      "customerName", "customerPhone", "customerAddress", "customerCity", "customerNote",
    ] as const;
    const numberFields = ["width", "height", "quantity", "totalPrice"] as const;
    const updateSet: Record<string, unknown> = { updatedAt: new Date() };

    for (const field of textFields) {
      if (typeof req.body?.[field] === "string") updateSet[field] = req.body[field].trim();
    }
    for (const field of numberFields) {
      if (req.body?.[field] !== undefined) {
        const value = Number(req.body[field]);
        if (!Number.isFinite(value) || value < 0) {
          res.status(400).json({ error: `${field} için geçerli bir değer girin.` });
          return;
        }
        updateSet[field] = field === "quantity" ? Math.max(1, Math.round(value)) : value.toFixed(2);
      }
    }

    const db = await getDb();
    if (!db) {
      const order = demoOrders.find(item => Number(item.id) === id) as Record<string, unknown> | undefined;
      if (!order) {
        res.status(404).json({ error: "Sipariş bulunamadı." });
        return;
      }
      Object.assign(order, updateSet);
      res.json({ success: true, order, demoMode: true });
      return;
    }

    const existing = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing[0]) {
      res.status(404).json({ error: "Sipariş bulunamadı." });
      return;
    }

    await db.update(orders).set(updateSet).where(eq(orders.id, id));
    const updated = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    res.json({ success: true, order: updated[0], demoMode: false });
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

    const orderRows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const order = orderRows[0];
    if (!order) {
      res.status(404).json({ error: "Sipariş bulunamadı." });
      return;
    }

    await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id));

    if (order.userId > 0 && order.status !== status) {
      void sendPushToUser(order.userId, "RGNFIX Sipariş Güncellemesi", `#${order.orderNumber} numaralı siparişiniz: ${STATUS_LABELS[status]}`, {
        type: "order_status",
        orderId: String(order.id),
        orderNumber: order.orderNumber,
        status,
        deepLink: `/hesabim?order=${order.id}`,
      });
    }

    res.json({ success: true, demoMode: false });
  });
}
