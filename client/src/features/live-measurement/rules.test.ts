import { describe, expect, it } from "vitest";
import {
  calculateProductionMeasurement,
  normalizeCmInput,
  validateMountingType,
} from "./rules";

describe("RGNFIX canlı ölçü kuralları", () => {
  it("virgüllü santimetre girişini bir milimetre hassasiyetinde korur", () => {
    expect(normalizeCmInput("56,4")).toBe(56.4);
    expect(normalizeCmInput("178.3")).toBe(178.3);
  });

  it("birden fazla küsurat hanesini sessizce yuvarlamaz", () => {
    expect(() => normalizeCmInput("56.45")).toThrow();
  });

  it("yalnızca ilk açılan cam balkon kanadının eninden 2 cm düşer", () => {
    expect(calculateProductionMeasurement({
      applicationArea: "cam_balkon",
      panelType: "first_opening_panel",
      measuredWidthCm: 56.4,
      measuredHeightCm: 178.3,
    })).toMatchObject({
      productionWidthCm: 54.4,
      productionHeightCm: 178.3,
      widthDeductionCm: 2,
      heightDeductionCm: 0,
    });
  });

  it("normal cam balkon kanadını aynen kullanır", () => {
    expect(calculateProductionMeasurement({
      applicationArea: "cam_balkon",
      panelType: "normal_panel",
      measuredWidthCm: 57.1,
      measuredHeightCm: 178.2,
    })).toMatchObject({
      productionWidthCm: 57.1,
      productionHeightCm: 178.2,
      widthDeductionCm: 0,
      heightDeductionCm: 0,
    });
  });

  it("PVC ve alüminyum sistemlerde hiçbir pay düşmez", () => {
    expect(calculateProductionMeasurement({
      applicationArea: "pvc_pencere",
      panelType: "normal_panel",
      measuredWidthCm: 72.4,
      measuredHeightCm: 134.8,
    })).toMatchObject({ productionWidthCm: 72.4, productionHeightCm: 134.8 });

    expect(calculateProductionMeasurement({
      applicationArea: "aluminyum_kapi",
      panelType: "normal_panel",
      measuredWidthCm: 84.7,
      measuredHeightCm: 201.3,
    })).toMatchObject({ productionWidthCm: 84.7, productionHeightCm: 201.3 });
  });

  it("PVC ve alüminyum sistemlerde kancalı montajı reddeder", () => {
    expect(validateMountingType("pvc_kapi", "kancali").valid).toBe(false);
    expect(validateMountingType("aluminyum_pencere", "kancali").valid).toBe(false);
    expect(validateMountingType("cam_balkon", "kancali").valid).toBe(true);
  });
});
