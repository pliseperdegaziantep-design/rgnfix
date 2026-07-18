export type ApplicationArea =
  | "cam_balkon"
  | "pvc_pencere"
  | "pvc_kapi"
  | "pvc_surgulu_kapi"
  | "aluminyum_pencere"
  | "aluminyum_kapi"
  | "aluminyum_surgulu_kapi";

export type MountingType = "kancali" | "vidali" | "yapisma";
export type PanelType = "opening_panel" | "normal_panel";
export type CameraGuideMode = "frame" | "width" | "height";

export interface ApplicationAreaOption {
  id: ApplicationArea;
  name: string;
  description: string;
  pieceLabel: "Kanat" | "Parça";
}

export interface MeasurementPanelDraft {
  id: string;
  measuredWidth: string;
  measuredHeight: string;
  heightCheck: string;
  isOpeningPanel: boolean;
  duplicateConfirmed: boolean;
  completed: boolean;
}

export interface CalculatedMeasurement {
  index: number;
  label: string;
  panelType: PanelType;
  measuredWidthCm: number;
  measuredHeightCm: number;
  widthDeductionCm: number;
  heightDeductionCm: number;
  productionWidthCm: number;
  productionHeightCm: number;
}

export interface MeasurementTransferPayload {
  source: "rgnfix-live-measurement";
  createdAt: string;
  applicationArea: ApplicationArea;
  mountType: MountingType;
  caseType: string;
  items: Array<{
    id: string;
    label: string;
    width: string;
    height: string;
    quantity: string;
  }>;
}

export const APPLICATION_AREAS: ApplicationAreaOption[] = [
  { id: "cam_balkon", name: "Cam Balkon", description: "Katlanır cam balkon kanatları", pieceLabel: "Kanat" },
  { id: "pvc_pencere", name: "PVC Pencere", description: "PVC doğrama pencere", pieceLabel: "Parça" },
  { id: "pvc_kapi", name: "PVC Kapı", description: "PVC doğrama kapı", pieceLabel: "Parça" },
  { id: "pvc_surgulu_kapi", name: "PVC Sürgülü Kapı", description: "PVC sürgülü kapı sistemi", pieceLabel: "Parça" },
  { id: "aluminyum_pencere", name: "Alüminyum Pencere", description: "Alüminyum doğrama pencere", pieceLabel: "Parça" },
  { id: "aluminyum_kapi", name: "Alüminyum Kapı", description: "Alüminyum doğrama kapı", pieceLabel: "Parça" },
  { id: "aluminyum_surgulu_kapi", name: "Alüminyum Sürgülü Kapı", description: "Alüminyum sürgülü kapı sistemi", pieceLabel: "Parça" },
];

export const MOUNTING_OPTIONS: Record<ApplicationArea, MountingType[]> = {
  cam_balkon: ["kancali", "vidali", "yapisma"],
  pvc_pencere: ["vidali", "yapisma"],
  pvc_kapi: ["vidali", "yapisma"],
  pvc_surgulu_kapi: ["vidali", "yapisma"],
  aluminyum_pencere: ["vidali", "yapisma"],
  aluminyum_kapi: ["vidali", "yapisma"],
  aluminyum_surgulu_kapi: ["vidali", "yapisma"],
};

export const MOUNTING_LABELS: Record<MountingType, string> = {
  kancali: "Kancalı",
  vidali: "Vidalı",
  yapisma: "Yapıştırmalı",
};

export const MEASUREMENT_RULES = {
  cam_balkon: {
    opening_panel: { widthDeductionCm: 2, heightDeductionCm: 0 },
    normal_panel: { widthDeductionCm: 0, heightDeductionCm: 0 },
  },
  pvc_pencere: { widthDeductionCm: 0, heightDeductionCm: 0 },
  pvc_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
  pvc_surgulu_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
  aluminyum_pencere: { widthDeductionCm: 0, heightDeductionCm: 0 },
  aluminyum_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
  aluminyum_surgulu_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
} as const;

export const CAM_BALCONY_CONFIRMATIONS = [
  "Ölçüleri çelik metreyle aldım.",
  "Ölçüleri santimetre olarak aynen yazdım; varsa küsuratı virgülle girdim.",
  "Ölçüleri aşağı veya yukarı yuvarlamadım.",
  "Bütün camları aynı görünse bile ayrı ayrı ölçtüm.",
  "En ölçülerini cam içinden cam içine aldım.",
  "Boy ölçülerini cam içinden cam içine net aldım.",
  "Açılır olan bütün kanatları ayrı ayrı işaretledim.",
  "Açılır kanatlar için kendim pay düşmedim.",
  "Girdiğim ölçüleri çelik metreden okuyarak yazdım.",
] as const;

export const PVC_ALUMINUM_CONFIRMATIONS = [
  "Ölçüleri çelik metreyle aldım.",
  "En ve boy ölçülerini cam içinden cam içine aldım.",
  "Ölçüleri santimetre olarak aynen yazdım; varsa küsuratı virgülle girdim.",
  "Herhangi bir pay düşmedim.",
  "Kancalı montaj seçmediğimi onaylıyorum.",
] as const;

const CM_PATTERN = /^\d+(?:[.,]\d)?$/;

/**
 * Santimetre girişini doğrular. Tam sayı veya bir ondalık basamak kabul edilir.
 * Değer sessizce değiştirilmez veya fiyat yuvarlamasına tabi tutulmaz.
 */
export function normalizeCmInput(value: unknown): number {
  const raw = String(value ?? "").trim();
  if (!CM_PATTERN.test(raw)) {
    throw new Error("Ölçüyü santimetre olarak tam sayı veya en fazla bir küsurat hanesiyle girin. Örnek: 56 veya 56,4");
  }

  const measurement = Number(raw.replace(",", "."));
  if (!Number.isFinite(measurement) || measurement <= 0) {
    throw new Error("Geçerli ve sıfırdan büyük bir santimetre ölçüsü girin.");
  }
  return measurement;
}

export function cmToInternalMm(valueCm: number): number {
  return Math.round(valueCm * 10);
}

export function internalMmToCm(valueMm: number): number {
  return Number((valueMm / 10).toFixed(1));
}

export function formatCm(valueCm: number): string {
  const formatted = Number.isInteger(valueCm) ? valueCm.toFixed(0) : valueCm.toFixed(1);
  return formatted.replace(".", ",");
}

export function validateMountingType(applicationArea: ApplicationArea, mountingType: MountingType) {
  const allowedOptions = MOUNTING_OPTIONS[applicationArea];
  return allowedOptions.includes(mountingType)
    ? { valid: true as const }
    : { valid: false as const, message: "Bu uygulama alanında seçtiğiniz montaj tipi kullanılamaz." };
}

export function calculateProductionMeasurement({
  applicationArea,
  panelType,
  measuredWidthCm,
  measuredHeightCm,
}: {
  applicationArea: ApplicationArea;
  panelType: PanelType;
  measuredWidthCm: number;
  measuredHeightCm: number;
}) {
  const rule = applicationArea === "cam_balkon"
    ? MEASUREMENT_RULES.cam_balkon[panelType]
    : MEASUREMENT_RULES[applicationArea];

  const measuredWidthMm = cmToInternalMm(measuredWidthCm);
  const measuredHeightMm = cmToInternalMm(measuredHeightCm);
  const widthDeductionMm = cmToInternalMm(rule.widthDeductionCm);
  const heightDeductionMm = cmToInternalMm(rule.heightDeductionCm);
  const productionWidthMm = measuredWidthMm - widthDeductionMm;
  const productionHeightMm = measuredHeightMm - heightDeductionMm;

  if (productionWidthMm <= 0 || productionHeightMm <= 0) {
    throw new Error("Hesaplanan üretim ölçüsü geçersizdir. Ölçüyü yeniden kontrol edin.");
  }

  return {
    measuredWidthCm: internalMmToCm(measuredWidthMm),
    measuredHeightCm: internalMmToCm(measuredHeightMm),
    widthDeductionCm: internalMmToCm(widthDeductionMm),
    heightDeductionCm: internalMmToCm(heightDeductionMm),
    productionWidthCm: internalMmToCm(productionWidthMm),
    productionHeightCm: internalMmToCm(productionHeightMm),
  };
}

export function calculatePanel(
  applicationArea: ApplicationArea,
  panel: MeasurementPanelDraft,
  index: number,
): CalculatedMeasurement {
  const measuredWidthCm = normalizeCmInput(panel.measuredWidth);
  const measuredHeightCm = normalizeCmInput(panel.measuredHeight);
  const checkedHeightCm = normalizeCmInput(panel.heightCheck);

  if (cmToInternalMm(measuredHeightCm) !== cmToInternalMm(checkedHeightCm)) {
    throw new Error("İki boy ölçümü farklı çıktı. Çelik metreyi düz tutarak boyu bir kez daha ölçelim.");
  }

  const panelType: PanelType = applicationArea === "cam_balkon" && panel.isOpeningPanel
    ? "opening_panel"
    : "normal_panel";
  const result = calculateProductionMeasurement({
    applicationArea,
    panelType,
    measuredWidthCm,
    measuredHeightCm,
  });

  const area = APPLICATION_AREAS.find(option => option.id === applicationArea);
  const baseLabel = `${index + 1}. ${area?.pieceLabel ?? "Parça"}`;
  return {
    index,
    label: panelType === "opening_panel" ? `${baseLabel} – Açılır kanat` : baseLabel,
    panelType,
    ...result,
  };
}

export function measurementKey(width: string, height: string): string | null {
  try {
    return `${cmToInternalMm(normalizeCmInput(width))}x${cmToInternalMm(normalizeCmInput(height))}`;
  } catch {
    return null;
  }
}

export function hasDuplicateMeasurement(
  panels: MeasurementPanelDraft[],
  currentIndex: number,
): boolean {
  const current = panels[currentIndex];
  if (!current) return false;
  const key = measurementKey(current.measuredWidth, current.measuredHeight);
  if (!key) return false;
  return panels.some((panel, index) => index !== currentIndex && panel.completed && measurementKey(panel.measuredWidth, panel.measuredHeight) === key);
}

export function buildMeasurementText({
  applicationArea,
  mountType,
  measurements,
}: {
  applicationArea: ApplicationArea;
  mountType: MountingType;
  measurements: CalculatedMeasurement[];
}) {
  const areaName = APPLICATION_AREAS.find(option => option.id === applicationArea)?.name ?? applicationArea;
  const lines = [
    "Merhaba, RGNFIX Ölçü Asistanı üzerinden ölçülerimi aldım.",
    "",
    `Uygulama alanı: ${areaName}`,
    `Montaj tipi: ${MOUNTING_LABELS[mountType]}`,
    "",
  ];

  measurements.forEach(measurement => {
    lines.push(measurement.label);
    lines.push(`Ölçtüğüm net ölçü: ${formatCm(measurement.measuredWidthCm)} × ${formatCm(measurement.measuredHeightCm)} cm`);
    lines.push(`Sistem üretim ölçüsü: ${formatCm(measurement.productionWidthCm)} × ${formatCm(measurement.productionHeightCm)} cm`);
    lines.push("");
  });

  lines.push("Ölçü notumun ve fotoğrafımın kontrol edilmesini rica ediyorum.");
  return lines.join("\n");
}

export function createTransferPayload({
  applicationArea,
  mountType,
  caseType,
  measurements,
}: {
  applicationArea: ApplicationArea;
  mountType: MountingType;
  caseType: string;
  measurements: CalculatedMeasurement[];
}): MeasurementTransferPayload {
  return {
    source: "rgnfix-live-measurement",
    createdAt: new Date().toISOString(),
    applicationArea,
    mountType,
    caseType,
    items: measurements.map(measurement => ({
      id: String(measurement.index + 1),
      label: measurement.label,
      width: formatCm(measurement.productionWidthCm),
      height: formatCm(measurement.productionHeightCm),
      quantity: "1",
    })),
  };
}
