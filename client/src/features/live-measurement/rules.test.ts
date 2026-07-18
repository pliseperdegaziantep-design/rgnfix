import { describe, expect, it } from "vitest";
import {
  calculatePanel,
  calculateProductionMeasurement,
  formatCm,
  normalizeCmInput,
  validateMountingType,
} from "./rules";

describe("RGNFIX sade ölçü kuralları", () => {
  it("tam sayı, virgüllü ve noktalı ölçüleri kabul eder", () => {
    expect(normalizeCmInput("56")).toBe(56);
    expect(normalizeCmInput("56,4")).toBe(56.4);
    expect(normalizeCmInput("56.45")).toBe(56.45);
  });

  it("ölçüleri kullanıcıya virgülle gösterir", () => {
    expect(formatCm(56)).toBe("56");
    expect(formatCm(56.4)).toBe("56,4");
    expect(formatCm(56.45)).toBe("56,45");
  });

  it("açılır olarak işaretlenen her cam balkon kanadının eninden 2 cm düşer", () => {
    expect(calculatePanel("cam_balkon", {
      id: "1",
      measuredWidth: "56,4",
      measuredHeight: "178",
      isOpeningPanel: true,
      completed: true,
    }, 0).productionWidthCm).toBe(54.4);

    expect(calculatePanel("cam_balkon", {
      id: "3",
      measuredWidth: "59",
      measuredHeight: "178,2",
      isOpeningPanel: true,
      completed: true,
    }, 2).productionWidthCm).toBe(57);
  });

  it("açılır kanat işaretlenmezse cam balkon ölçüsünü aynen kullanır", () => {
    expect(calculatePanel("cam_balkon", {
      id: "2",
      measuredWidth: "57,1",
      measuredHeight: "178,2",
      isOpeningPanel: false,
      completed: true,
    }, 1)).toMatchObject({
      productionWidthCm: 57.1,
      productionHeightCm: 178.2,
      widthDeductionCm: 0,
    });
  });

  it("PVC ve alüminyum sistemlerde pay düşmez", () => {
    expect(calculateProductionMeasurement({
      applicationArea: "pvc_pencere",
      panelType: "normal_panel",
      measuredWidthCm: 72.4,
      measuredHeightCm: 134.8,
    })).toMatchObject({ productionWidthCm: 72.4, productionHeightCm: 134.8 });
  });

  it("PVC ve alüminyum sistemlerde kancalı montajı reddeder", () => {
    expect(validateMountingType("pvc_kapi", "kancali").valid).toBe(false);
    expect(validateMountingType("aluminyum_pencere", "kancali").valid).toBe(false);
    expect(validateMountingType("cam_balkon", "kancali").valid).toBe(true);
  });
});
