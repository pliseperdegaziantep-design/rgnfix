import { FABRIC_SERIES, PROFILE_COLORS } from "@shared/types";

const commonColors = PROFILE_COLORS.map(color => color.name);

export const fallbackFabrics = FABRIC_SERIES.map((series, index) => ({
  id: index + 1,
  name: series.name,
  slug: series.id,
  description: series.description,
  privacy: Math.max(1, Math.round(series.opacity / 10)),
  sunControl: Math.max(1, Math.round(series.opacity / 10)),
  heatInsulation: series.features.some(feature => feature.includes("ısı")) ? 8 : 4,
  cleaning: series.features.some(feature => feature.toLowerCase().includes("temiz")) ? 8 : 6,
  durability: Math.min(10, Math.max(5, Math.round(series.weight / 30))),
  blackout: Math.max(1, Math.round(series.opacity / 10)),
  usageArea: "Cam balkon, PVC pencere, alüminyum doğrama ve sürgülü kapı uygulamaları",
  advantages: series.features.join(", "),
  disadvantages: null,
  pricePerSqm: series.pricePerSqm.toFixed(2),
  imageUrl: series.imageUrl,
  colors: commonColors,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
}));

export const fallbackDealers = [
  {
    id: 1,
    name: "RGNFIX Merkez",
    address: "Gaziantep merkez showroom",
    city: "Gaziantep",
    district: "Şehitkamil",
    phone: "+90 530 028 89 03",
    whatsapp: "905300288903",
    email: "info@rgnperde.com",
    lat: "37.0662",
    lng: "37.3833",
    isActive: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  },
];

type DemoOrderStatus =
  | "pending"
  | "confirmed"
  | "production"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled";

type DemoOrder = {
  id: number;
  userId: number;
  orderNumber: string;
  status: DemoOrderStatus;
  fabricId: number;
  fabricName: string;
  fabricColor: string;
  profileColor: string;
  mountType: string;
  caseType: string;
  width: string;
  height: string;
  quantity: number;
  unitPrice: string;
  mountingPrice: string;
  shippingPrice: string;
  totalPrice: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const demoOrders: DemoOrder[] = [];
