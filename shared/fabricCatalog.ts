export type FabricVariant = {
  code: string;
  name: string;
};

export const FABRIC_VARIANTS: Record<string, FabricVariant[]> = {
  nova: [
    { code: "VR 01", name: "Beyaz" },
    { code: "VR 02", name: "Krem" },
    { code: "VR 03", name: "Bej" },
    { code: "VR 04", name: "Açık Gri" },
    { code: "VR 05", name: "Gümüş Gri" },
    { code: "VR 06", name: "Gri" },
    { code: "VR 07", name: "Antrasit" },
    { code: "VR 08", name: "Kahve" },
    { code: "VR 09", name: "Lacivert" },
    { code: "VR 10", name: "Siyah" },
  ],
  "neo-fashion": [
    { code: "VR 01", name: "Beyaz" },
    { code: "VR 02", name: "Krem" },
    { code: "VR 03", name: "Gri" },
    { code: "VR 04", name: "Antrasit" },
    { code: "VR 05", name: "Beyaz Desenli" },
    { code: "VR 06", name: "Ekru" },
    { code: "VR 07", name: "Açık Gri" },
    { code: "VR 08", name: "Koyu Gri" },
  ],
  "nano-clean": [
    { code: "VR 01", name: "Beyaz" },
    { code: "VR 02", name: "Krem" },
    { code: "VR 03", name: "Gri" },
    { code: "VR 04", name: "Antrasit" },
  ],
  "nano-insulation": [
    { code: "VR 01", name: "Krem" },
    { code: "VR 02", name: "Açık Gri" },
    { code: "VR 03", name: "Antrasit" },
  ],
  "nano-pro": [
    { code: "VR 01", name: "Beyaz" },
    { code: "VR 02", name: "Krem" },
    { code: "VR 03", name: "Gri" },
    { code: "VR 04", name: "Antrasit" },
  ],
};

export function getFabricVariants(seriesId: string): FabricVariant[] {
  return FABRIC_VARIANTS[seriesId] ?? [];
}

export function getCurrentFabricPrice(seriesId: string, defaultPrice: number): number {
  return seriesId === "nova" ? 485 : defaultPrice;
}

export function getMountingSurcharge(mountType: string): number {
  return ["yapisma", "yapistirma", "yapıştırma"].includes(mountType) ? 65 : 0;
}

export function formatFabricVariant(variant: FabricVariant): string {
  return `${variant.code} – ${variant.name}`;
}
