export type OrderMeasurement = {
  label: string;
  width: number;
  height: number;
  quantity: number;
};

export type OrderMeasurementSource = {
  measurements?: unknown;
  width?: string | number | null;
  height?: string | number | null;
  quantity?: string | number | null;
};

function parsePositiveNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseMeasurements(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || value.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeOrderMeasurements(source: OrderMeasurementSource): OrderMeasurement[] {
  const parsed = parseMeasurements(source.measurements)
    .map((item, index): OrderMeasurement | null => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const width = parsePositiveNumber(candidate.width);
      const height = parsePositiveNumber(candidate.height);
      if (!width || !height) return null;
      return {
        label: typeof candidate.label === "string" && candidate.label.trim() ? candidate.label.trim() : `${index + 1}. Ölçü`,
        width,
        height,
        quantity: parsePositiveInteger(candidate.quantity ?? candidate.qty),
      };
    })
    .filter((item): item is OrderMeasurement => Boolean(item));

  if (parsed.length > 0) return parsed;

  const width = parsePositiveNumber(source.width);
  const height = parsePositiveNumber(source.height);
  if (!width || !height) return [];
  return [{ label: "1. Ölçü", width, height, quantity: parsePositiveInteger(source.quantity) }];
}

export function formatMeasurementLine(item: OrderMeasurement) {
  return `${item.label}: ${item.width} × ${item.height} cm · ${item.quantity} adet`;
}

export function formatCaseType(caseType?: string | null) {
  if (caseType === "kalin") return "Standart Kasa";
  if (caseType === "slim") return "Slim Kasa";
  return caseType || "-";
}
