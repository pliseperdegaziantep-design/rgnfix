import { randomInt } from "crypto";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { fabrics, orders, measurements, dealers, users } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { demoOrders, fallbackDealers, fallbackFabrics } from "./sampleData";

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
- Nova: %60 opaklık, 120 gr/m², güneş kontrolü, kolay temizlenir, 2 yıl garanti (485 ₺/m²)
- Neo Fashion: %70 opaklık, 150 gr/m², güneş kontrolü, %50 ısı yalıtımı, 5 yıl ömür (545 ₺/m²)
- Nano Clean: %70 opaklık, 150 gr/m², anti-bakteriyel, leke tutmaz (545 ₺/m²)
- Nano Insulation: %80 opaklık, 240 gr/m², %50 ısı yalıtımı, enerji tasarrufu (645 ₺/m²)
- Nano Pro: %80 opaklık, 300 gr/m², %80 kapatma, 6 yıl ömür, premium (845 ₺/m²)

Kasa tipleri: Tek cama kalın kasa, çift cama slim kasa uygulanır. Slim kasa farkı m² başına +60 ₺.

Montaj tipleri: Vidalı (en sağlam), Kancalı (sökülebilir, cam balkona uygun), Yapıştırma (iz bırakmaz)
- Cam balkona: Vidalı, Kancalı, Yapıştırma
- PVC cam ve alüminyum doğramaya: Vidalı, Yapıştırma
- Sürgülü kapıya: Vidalı, Yapıştırma

Ölçü kuralları:
- Cam balkon: Tüm kanatlarda cam ölçüsü alınır, açılır kanat (kollu/zincirli) 2 cm enden pay düşülür, yükseklik cam içinden cam içine, sırasıyla numaralandırılır
- PVC cam ve alüminyum doğrama: Cam içinden cam içine net yazılır, pay düşülmez
- Sürgülü kapı: Cam içinden cam içine alınır, yapıştırma ve vidalı montaj yapılır

Fiyat hesaplama kuralları:
- Ölçüler 5'in katına yuvarlanır (65→70, 78→80)
- Minimum hesaplama birimi 1 m² (1 m²'nin altı 1 m² olarak hesaplanır)
- 1 m²'üstü olduğu gibi birim fiyatla çarpılır
- 3.000 ₺ üzeri kargo ücretsiz
- Montaj fiyatı gösterilmez

Tüm kumaş serileri mahremiyet oluşturur.

Profil renkleri: Beyaz, Krem, Gümüş Gri, Antrasit, Kahve, Bronz

Kullanıcıya şunları öner:
1. En uygun kumaş ve nedeni
2. Montaj tipi önerisi
3. Profil ve kumaş rengi
4. Tahmini fiyat (m² bazında)
5. Bakım önerileri

Kısa, net ve yardımcı yanıtlar ver. Markdown formatı kullan.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...input.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
            ],
          });

          const rawContent = response.choices?.[0]?.message?.content || "Üzgünüm, şu anda yanıt veremiyorum.";
          const content = typeof rawContent === "string" ? rawContent : "Üzgünüm, şu anda yanıt veremiyorum.";
          return { content };
        } catch (error) {
          console.error("[AI] Chat request failed:", error);
          const lastQuestion = input.messages.at(-1)?.content || "";
          return {
            content:
              `Demo modundayım; AI anahtarı tanımlanınca canlı danışman olarak yanıt veririm.\n\n` +
              `Sorunuz: "${lastQuestion}"\n\n` +
              `Genel öneri: güneş ve ısı kontrolü için Nano Insulation, yüksek mahremiyet ve premium kullanım için Nano Pro, ekonomik çözüm için Nova serisini değerlendirin. Cam balkonlarda vidalı veya kancalı montaj; PVC/alüminyum doğramalarda vidalı veya yapıştırma montaj uygundur.`,
          };
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
        const prompt = `Bir iç mekan renk danışmanı olarak, aşağıdaki oda bilgilerine göre en uygun plise perde renklerini öner.

Duvar rengi: ${input.wallColor}
Zemin rengi: ${input.floorColor || "belirtilmedi"}
Mobilya rengi: ${input.furnitureColor || "belirtilmedi"}
Dekorasyon stili: ${input.decorStyle}

JSON formatında yanıt ver:
{
  "fabricColors": ["renk1", "renk2", "renk3"],
  "profileColor": "önerilen profil rengi",
  "reasoning": "neden bu renkleri önerdiğinin kısa açıklaması"
}`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "Sen bir iç mekan tasarım ve renk danışmanısın. Türkçe yanıt ver. Sadece JSON formatında yanıt ver." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "color_advice",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    fabricColors: { type: "array", items: { type: "string" }, description: "Önerilen kumaş renkleri" },
                    profileColor: { type: "string", description: "Önerilen profil rengi" },
                    reasoning: { type: "string", description: "Açıklama" },
                  },
                  required: ["fabricColors", "profileColor", "reasoning"],
                  additionalProperties: false,
                },
              },
            },
          });

          const rawC = response.choices?.[0]?.message?.content || "";
          const contentStr = typeof rawC === "string" ? rawC : "";
          return JSON.parse(contentStr);
        } catch {
          return {
            fabricColors: ["Krem", "Beyaz", "Açık Gri"],
            profileColor: "Beyaz",
            reasoning: "Nötr tonlar her dekorasyon stiliyle uyum sağlar.",
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
        width: z.number(),
        height: z.number(),
        quantity: z.number(),
        totalPrice: z.number(),
        customerName: z.string(),
        customerPhone: z.string(),
        customerAddress: z.string(),
        customerCity: z.string(),
        customerNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();

        let orderNumber = "";
        for (let attempt = 0; attempt < 50; attempt += 1) {
          const candidate = randomInt(10000, 100000).toString();
          if (!db) {
            if (!demoOrders.some(order => order.orderNumber === candidate)) {
              orderNumber = candidate;
              break;
            }
          } else {
            const existing = await db
              .select({ id: orders.id })
              .from(orders)
              .where(eq(orders.orderNumber, candidate))
              .limit(1);
            if (existing.length === 0) {
              orderNumber = candidate;
              break;
            }
          }
        }
        if (!orderNumber) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Sipariş numarası üretilemedi." });
        }

        const isFreeShipping = input.totalPrice >= 3000;
        const orderValues = {
          userId: ctx.user?.id && ctx.user.id > 0 ? ctx.user.id : 0,
          orderNumber,
          fabricId: input.fabricId,
          fabricName: input.fabricName,
          fabricColor: input.fabricColor,
          profileColor: input.profileColor,
          mountType: input.mountType,
          caseType: input.caseType,
          width: input.width.toString(),
          height: input.height.toString(),
          quantity: input.quantity,
          unitPrice: (input.totalPrice / Math.max(input.quantity, 1)).toFixed(2),
          mountingPrice: "0.00",
          shippingPrice: isFreeShipping ? "0.00" : "0.00",
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
      return db
        .select()
        .from(orders)
        .where(eq(orders.userId, ctx.user.id))
        .orderBy(desc(orders.createdAt));
    }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const now = Date.now();
        const cancelWindowMs = 24 * 60 * 60 * 1000;

        if (!db) {
          const order = demoOrders.find(item => Number(item.id) === input.id);
          if (!order || Number(order.userId) !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Sipariş bulunamadı." });
          }
          if (now - new Date(order.createdAt).getTime() > cancelWindowMs) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "24 saatlik iptal süresi dolmuş." });
          }
          if (order.status === "cancelled" || order.status === "delivered") {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Bu sipariş iptal edilemez." });
          }
          order.status = "cancelled";
          order.updatedAt = new Date();
          return { success: true };
        }

        const result = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
        const order = result[0];
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Sipariş bulunamadı." });
        }
        if (now - new Date(order.createdAt).getTime() > cancelWindowMs) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "24 saatlik iptal süresi dolmuş." });
        }
        if (order.status === "cancelled" || order.status === "delivered") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Bu sipariş iptal edilemez." });
        }

        await db
          .update(orders)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(orders.id, input.id));
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
      .input(z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (ctx.user.id <= 0) return { success: true };
        const updateSet: Record<string, unknown> = {};
        if (input.name !== undefined) updateSet.name = input.name;
        if (input.phone !== undefined) updateSet.phone = input.phone;
        if (input.city !== undefined) updateSet.city = input.city;
        if (input.address !== undefined) updateSet.address = input.address;
        if (Object.keys(updateSet).length > 0) {
          await db.update(users).set(updateSet).where(eq(users.id, ctx.user.id));
        }
        return { success: true };
      }),
  }),

  measurements: router({
    save: protectedProcedure
      .input(z.object({
        windowType: z.string(),
        mountType: z.string(),
        width: z.number(),
        height: z.number(),
        windowCount: z.number(),
        notes: z.string().optional(),
      }))
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
