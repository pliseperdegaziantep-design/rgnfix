import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { demoOrders } from "./sampleData";
import type { TrpcContext } from "./_core/context";
import { formatCaseType, normalizeOrderMeasurements } from "@shared/orderMeasurements";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("orders.create measurements", () => {
  beforeEach(() => {
    demoOrders.length = 0;
  });

  it("stores every submitted measurement and keeps legacy summary fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.orders.create({
      fabricId: 1,
      fabricName: "Nova",
      fabricColor: "VR 02 Krem",
      profileColor: "Beyaz",
      mountType: "vidali",
      caseType: "kalin",
      width: 50,
      height: 120,
      quantity: 1,
      measurements: [
        { label: "Pencere 1", width: 50, height: 120, quantity: 1 },
        { label: "Pencere 2", width: 65.5, height: 130, quantity: 2 },
        { label: "Kapı 1", width: 80, height: 210, quantity: 1 },
      ],
      totalPrice: 3450,
      customerName: "Test Müşteri",
      customerPhone: "05300000000",
      customerAddress: "Test adresi",
      customerCity: "Gaziantep",
      customerNote: "Test notu",
    });

    const saved = demoOrders.find(order => order.orderNumber === result.orderNumber);
    expect(saved?.measurements).toHaveLength(3);
    expect(saved?.width).toBe("50");
    expect(saved?.height).toBe("120");
    expect(saved?.quantity).toBe(4);
    expect(normalizeOrderMeasurements(saved ?? {})).toEqual([
      { label: "Pencere 1", width: 50, height: 120, quantity: 1 },
      { label: "Pencere 2", width: 65.5, height: 130, quantity: 2 },
      { label: "Kapı 1", width: 80, height: 210, quantity: 1 },
    ]);
    expect(formatCaseType(saved?.caseType)).toBe("Standart Kasa");
  });

  it("falls back to legacy width, height and quantity for old orders", () => {
    expect(normalizeOrderMeasurements({ width: "70.00", height: "150.00", quantity: 2 })).toEqual([
      { label: "1. Ölçü", width: 70, height: 150, quantity: 2 },
    ]);
  });
});
