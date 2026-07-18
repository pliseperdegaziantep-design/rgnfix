export type ApplicationArea =
  | "cam_balkon"
  | "pvc_pencere_kapi"
  | "aluminyum_pencere_kapi"
  | "surgulu_kapi";

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
  isOpeningPanel: boolean;
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
  recordingUrl?: string;
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
  { id: "pvc_pencere_kapi", name: "PVC Pencere / PVC Kapı", description: "PVC doğrama pencere ve kapılar", pieceLabel: "Parça" },
  { id: "aluminyum_pencere_kapi", name: "Alüminyum Pencere / Alüminyum Kapı", description: "Alüminyum doğrama pencere ve kapılar", pieceLabel: "Parça" },
  { id: "surgulu_kapi", name: "PVC / Alüminyum Sürgülü Kapı", description: "PVC ve alüminyum sürgülü kapı sistemleri", pieceLabel: "Parça" },
];

export const MOUNTING_OPTIONS: Record<ApplicationArea, MountingType[]> = {
  cam_balkon: ["kancali", "vidali", "yapisma"],
  pvc_pencere_kapi: ["vidali", "yapisma"],
  aluminyum_pencere_kapi: ["vidali", "yapisma"],
  surgulu_kapi: ["vidali", "yapisma"],
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
  pvc_pencere_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
  aluminyum_pencere_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
  surgulu_kapi: { widthDeductionCm: 0, heightDeductionCm: 0 },
} as const;

const CM_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

export function normalizeCmInput(value: unknown): number {
  const raw = String(value ?? "").trim();
  if (!CM_PATTERN.test(raw)) throw new Error("Ölçüyü santimetre olarak girin. Örnek: 56 veya 56,4");
  const measurement = Number(raw.replace(",", "."));
  if (!Number.isFinite(measurement) || measurement <= 0) throw new Error("Sıfırdan büyük geçerli bir ölçü girin.");
  return measurement;
}

export function cmToInternalUnits(valueCm: number): number {
  return Math.round(valueCm * 100);
}

export function internalUnitsToCm(valueUnits: number): number {
  return Number((valueUnits / 100).toFixed(2));
}

export function formatCm(valueCm: number): string {
  const formatted = valueCm.toFixed(2).replace(/0+$/, "").replace(/[.,]$/, "");
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

  const measuredWidthUnits = cmToInternalUnits(measuredWidthCm);
  const measuredHeightUnits = cmToInternalUnits(measuredHeightCm);
  const widthDeductionUnits = cmToInternalUnits(rule.widthDeductionCm);
  const heightDeductionUnits = cmToInternalUnits(rule.heightDeductionCm);
  const productionWidthUnits = measuredWidthUnits - widthDeductionUnits;
  const productionHeightUnits = measuredHeightUnits - heightDeductionUnits;

  if (productionWidthUnits <= 0 || productionHeightUnits <= 0) throw new Error("Hesaplanan üretim ölçüsü geçersiz. Ölçüyü yeniden kontrol edin.");

  return {
    measuredWidthCm: internalUnitsToCm(measuredWidthUnits),
    measuredHeightCm: internalUnitsToCm(measuredHeightUnits),
    widthDeductionCm: internalUnitsToCm(widthDeductionUnits),
    heightDeductionCm: internalUnitsToCm(heightDeductionUnits),
    productionWidthCm: internalUnitsToCm(productionWidthUnits),
    productionHeightCm: internalUnitsToCm(productionHeightUnits),
  };
}

export function calculatePanel(applicationArea: ApplicationArea, panel: MeasurementPanelDraft, index: number): CalculatedMeasurement {
  const measuredWidthCm = normalizeCmInput(panel.measuredWidth);
  const measuredHeightCm = normalizeCmInput(panel.measuredHeight);
  const panelType: PanelType = applicationArea === "cam_balkon" && panel.isOpeningPanel ? "opening_panel" : "normal_panel";
  const result = calculateProductionMeasurement({ applicationArea, panelType, measuredWidthCm, measuredHeightCm });
  const area = APPLICATION_AREAS.find(option => option.id === applicationArea);
  const baseLabel = `${index + 1}. ${area?.pieceLabel ?? "Parça"}`;
  return { index, label: panelType === "opening_panel" ? `${baseLabel} – Açılır kanat` : baseLabel, panelType, ...result };
}

export function buildMeasurementText({ applicationArea, mountType, measurements }: {
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
    lines.push(`Cam ölçüsü: ${formatCm(measurement.measuredWidthCm)} × ${formatCm(measurement.measuredHeightCm)} cm`);
    lines.push("");
  });
  return lines.join("\n");
}

export function createTransferPayload({ applicationArea, mountType, caseType, measurements, recordingUrl }: {
  applicationArea: ApplicationArea;
  mountType: MountingType;
  caseType: string;
  measurements: CalculatedMeasurement[];
  recordingUrl?: string;
}): MeasurementTransferPayload {
  return {
    source: "rgnfix-live-measurement",
    createdAt: new Date().toISOString(),
    applicationArea,
    mountType,
    caseType,
    recordingUrl,
    items: measurements.map(measurement => ({
      id: String(measurement.index + 1),
      label: measurement.label,
      width: formatCm(measurement.productionWidthCm),
      height: formatCm(measurement.productionHeightCm),
      quantity: "1",
    })),
  };
}
