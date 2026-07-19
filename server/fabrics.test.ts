import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("fabrics.list", () => {
  it("returns an array of fabrics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.fabrics.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("pricePerSqm");
      expect(result[0]).toHaveProperty("slug");
    }
  });
});

describe("dealers.list", () => {
  it("returns an array of active dealers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.dealers.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("city");
      expect(result[0]).toHaveProperty("lat");
    }
  });
});
