import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { fabrics, orders, measurements, dealers, users } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { demoOrders, fallbackDealers, fallbackFabrics } from "./sampleData";
import type { OrderMeasurement } from "@shared/orderMeasurements";

async function getNextOrderNumber(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  return db.transaction(async tx => {
    await tx.execute(sql`UPDATE orderSequence SET nextNumber = LAST_INSERT_ID(nextNumber + 1) WHERE id = 1`);
    const [rows] = await tx.execute(sql`SELECT LAST_INSERT_ID() - 1 AS orderNumber`);
    const row = Array.isArray(rows) ? rows[0] as { orderNumber?: number | string } : undefined;
    const orderNumber = Number(row?.orderNumber);
    if (!Number.isInteger(orderNumber) || orderNumber < 10000) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sipariş numarası üretilemedi." });
    }
    return String(orderNumber);
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  ai: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const systemPrompt = `Sen RGNFIX akıllı ölçü ve demonte ürün danışmanısın. Türkçe yanıt ver. Kullanıcının ihtiyaçlarını anlayarak en uygun plise perde ve demonte ürün çözümünü öner.

Kumaş serileri:
- Nova: %60 opaklık, güneş kontrolü, kolay temizlenir, 2 yıl garanti. Vidalı ve kancalı 485 ₺/m², yapıştırma 550 ₺/m².
- Neo Fashion: %70 opaklık, %50 ısı yalıtımı, 5 yıl ömür.
- Nano Clean: leke tutmaz ve kolay temizlenir.
- Nano Insulation: ısı yalıtımlı.
- Nano Pro: premium karartma.

Kasa tipleri: Tek cama standart kasa, çift cama slim kasa uygulanır. Slim kasa farkı m² başına +60 ₺.
Montaj tipleri: Vidalı, Kancalı, Yapıştırma. Yapıştırma, vidalı ve kancalıdan m² başına 65 ₺ daha pahalıdır.
PVC ve alüminyum kapı veya pencerelerde kancalı montaj önerme.
Fiyatı tahmin etme; fiyat hesaplama ekranına yönlendir.
Kısa, net ve yardımcı yanıtlar ver.`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...input.messages.map(message => ({ role: message.role as "user" | "assistant", content: message.content })),
            ],
          });
          const rawContent = response.choices?.[0]?.message?.content || "Üzgünüm, şu anda yanıt veremiyorum.";
          return { content: typeof rawContent === "string" ? rawContent : "Üzgünüm, şu anda yanıt veremiyorum." };
        } catch (error) {
          console.error("[AI] Chat request failed:", error);
          return { content: "Canlı danışman şu anda yanıt veremiyor. Fiyat hesaplama ekranından kesin fiyat alabilirsiniz." };
        }
      }),

    colorAdvice: publicProcedure
      .input(z.object({
        wallColor: z.string(),
        floorColor: z.string().optional(),
        furnitureColor: z.string().optional(),
        decorStyle: z.string(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `Bir iç mekan renk danışmanı olarak yalnızca gerçekten uyan stok varyantlarını öner.
Duvar: ${input.wallColor}
Zemin: ${input.floorColor || "belirtilmedi"}
Mobilya: ${input.furnitureColor || "belirtilmedi"}
Stil: ${input.decorStyle}

Kurallar:
- Nova için stok örnekleri: VR 02 Krem, VR 04 Açık Gri, VR 06 Gri, VR 07 Antrasit.
- Neo Fashion için stok örnekleri: VR 02 Krem, VR 06 Ekru, VR 07 Açık Gri.
- Bir seride uygun renk yoksa o seriyi kesinlikle önerme.
- Her öneride seri adı, varyant kodu ve renk adı bulunmalı.
JSON döndür: {"recommendations":[{"series":"Nova","variant":"VR 02","color":"Krem"}],"profileColor":"Beyaz","reasoning":"kısa açıklama"}`;
        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Türkçe yanıt veren iç mekan renk danışmanısın. Yalnızca JSON döndür." },
              { role: "user", content: prompt },
            ],
          });
          const raw = response.choices?.[0]?.message?.content;
          return JSON.parse(typeof raw === "string" ? raw : "{}");
        } catch {
          return {
            recommendations: [
              { series: "Nova", variant: "VR 02", color: "Krem" },
              { series: "Neo Fashion", variant: "VR 02", color: "Krem" },
              { series: "Neo Fashion", variant: "VR 06", color: "Ekru" },
            ],
            profileColor: "Beyaz",
            reasoning: "Nötr ve sıcak tonlar seçilen alan renkleriyle güvenli uyum sağlar.",
          };
        }
      }),
  }),

  fabrics: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return fallbackFabrics;
      const result = await db.select().from(fabrics);
      return result.length > 0 ? result : fallbackFabrics;
    }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return fallbackFabrics.find(fabric => fabric.slug === input.slug) || null;
        const result = await db.select().from(fabrics).where(eq(fabrics.slug, input.slug)).limit(1);
        return result[0] || fallbackFabrics.find(fabric => fabric.slug === input.slug) || null;
      }),
  }),

  orders: router({
    create: publicProcedure
      .input(z.object({
        fabricId: z.number(),
        fabricName: z.string(),
        fabricColor: z.string(),
        profileColor: z.string(),
        mountType: z.string(),
        caseType: z.enum(["kalin", "slim"]),
        width: z.number().positive(),
        height: z.number().positive(),
        quantity: z.number().int().positive(),
        measurements: z.array(z.object({
          label: z.string().trim().min(1),
          width: z.number().positive(),
          height: z.number().positive(),
          quantity: z.number().int().positive(),
        })).min(1).optional(),
        totalPrice: z.number().nonnegative(),
        customerName: z.string().min(2),
        customerPhone: z.string().min(7),
        customerAddress: z.string().min(3),
        customerCity: z.string().min(2),
        customerNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const demoNext = Math.max(9999, ...demoOrders.map(order => Number(order.orderNumber) || 0)) + 1;
        const orderNumber = db ? await getNextOrderNumber(db) : String(demoNext);
        const allMeasurements: OrderMeasurement[] = (input.measurements?.length ? input.measurements : [{
          label: "1. Ölçü",
          width: input.width,
          height: input.height,
          quantity: input.quantity,
        }]).map((item, index) => ({
          label: item.label.trim() || `${index + 1}. Ölçü`,
          width: item.width,
          height: item.height,
          quantity: item.quantity,
        }));
        const firstMeasurement = allMeasurements[0];
        const totalQuantity = allMeasurements.reduce((sum, item) => sum + item.quantity, 0);
        const orderValues = {
          userId: ctx.user?.id && ctx.user.id > 0 ? ctx.user.id : 0,
          orderNumber,
          fabricId: input.fabricId,
          fabricName: input.fabricName,
          fabricColor: input.fabricColor,
          profileColor: input.profileColor,
          mountType: input.mountType,
          caseType: input.caseType,
          width: firstMeasurement.width.toString(),
          height: firstMeasurement.height.toString(),
          quantity: totalQuantity,
          measurements: allMeasurements,
          unitPrice: (input.totalPrice / Math.max(totalQuantity, 1)).toFixed(2),
          mountingPrice: "0.00",
          shippingPrice: "0.00",
          totalPrice: input.totalPrice.toFixed(2),
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          customerCity: input.customerCity,
          customerNote: input.customerNote || null,
        };

        if (!db) {
          demoOrders.unshift({
            id: demoOrders.length + 1,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
            ...orderValues,
          });
          return { orderNumber, demoMode: true };
        }

        await db.insert(orders).values(orderValues);
        return { orderNumber, demoMode: false };
      }),

    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return demoOrders
          .filter(order => Number(order.userId) === ctx.user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return db.select().from(orders).where(eq(orders.userId, ctx.user.id)).orderBy(desc(orders.createdAt));
    }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const now = Date.now();
        const cancelWindowMs = 24 * 60 * 60 * 1000;
        if (!db) {
          const order = demoOrders.find(item => Number(item.id) === input.id);
          if (!order || Number(order.userId) !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Sipariş bulunamadı." });
          if (now - new Date(order.createdAt).getTime() > cancelWindowMs) throw new TRPCError({ code: "BAD_REQUEST", message: "24 saatlik iptal süresi dolmuş." });
          if (order.status === "cancelled" || order.status === "delivered") throw new TRPCError({ code: "BAD_REQUEST", message: "Bu sipariş iptal edilemez." });
          order.status = "cancelled";
          order.updatedAt = new Date();
          return { success: true };
        }
        const result = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
        const order = result[0];
        if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Sipariş bulunamadı." });
        if (now - new Date(order.createdAt).getTime() > cancelWindowMs) throw new TRPCError({ code: "BAD_REQUEST", message: "24 saatlik iptal süresi dolmuş." });
        if (order.status === "cancelled" || order.status === "delivered") throw new TRPCError({ code: "BAD_REQUEST", message: "Bu sipariş iptal edilemez." });
        await db.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(eq(orders.id, input.id));
        return { success: true };
      }),
  }),

  dealers: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return fallbackDealers;
      const result = await db.select().from(dealers).where(eq(dealers.isActive, 1));
      return result.length > 0 ? result : fallbackDealers;
    }),
  }),

  profile: router({
    update: protectedProcedure
      .input(z.object({ name: z.string().optional(), phone: z.string().optional(), city: z.string().optional(), address: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (ctx.user.id <= 0) return { success: true };
        const updateSet: Record<string, unknown> = {};
        if (input.name !== undefined) updateSet.name = input.name;
        if (input.phone !== undefined) updateSet.phone = input.phone;
        if (input.city !== undefined) updateSet.city = input.city;
        if (input.address !== undefined) updateSet.address = input.address;
        if (Object.keys(updateSet).length > 0) await db.update(users).set(updateSet).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),

  measurements: router({
    save: protectedProcedure
      .input(z.object({ windowType: z.string(), mountType: z.string(), width: z.number(), height: z.number(), windowCount: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.insert(measurements).values({
          userId: ctx.user.id,
          windowType: input.windowType,
          mountType: input.mountType,
          width: input.width.toString(),
          height: input.height.toString(),
          windowCount: input.windowCount,
          notes: input.notes || null,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
