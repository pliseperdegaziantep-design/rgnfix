export interface Fabric {
  id: number;
  name: string;
  slug: string;
  series: string;
  description: string | null;
  privacy: number | null;
  sunControl: number | null;
  heatInsulation: number | null;
  cleaning: number | null;
  durability: number | null;
  blackout: number | null;
  usageArea: string | null;
  advantages: string | null;
  disadvantages: string | null;
  pricePerSqm: string;
  imageUrl: string | null;
  colors: string[] | null;
}

export interface Dealer {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  lat: string | null;
  lng: string | null;
}

export interface MeasurementData {
  windowType: string;
  mountType: string;
  width: number;
  height: number;
  windowCount: number;
  notes?: string;
}

export interface PriceCalculation {
  fabricId: number;
  fabricName: string;
  width: number;
  height: number;
  quantity: number;
  mountType: string;
  profileColor: string;
  fabricColor: string;
  caseType: "kalin" | "slim";
  unitPrice: number;
  caseSurcharge: number;
  mountingPrice: number;
  shippingPrice: number;
  totalPrice: number;
}

export interface OrderInput {
  fabricId: number;
  fabricName: string;
  fabricColor: string;
  profileColor: string;
  mountType: string;
  caseType: string;
  width: number;
  height: number;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
  caseSurcharge: number;
  mountingPrice: number;
  shippingPrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerNote?: string;
}

export type OrderStatus = "pending" | "confirmed" | "production" | "preparing" | "shipping" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Onay Bekliyor",
  confirmed: "Onaylandı",
  production: "Üretimde",
  preparing: "Hazırlanıyor",
  shipping: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

// Kumaş Serileri ve Fiyatları
export const FABRIC_SERIES = [
  {
    id: "nova",
    name: "Nova",
    pricePerSqm: 485,
    opacity: 60,
    weight: 120,
    pileFold: 20,
    material: "%100 Polyester",
    warranty: "2 Yıl",
    lifespan: "3 Yıl",
    features: ["Güneş kontrolü", "Kolay temizlenir", "%60 opaklık", "Mahremiyet oluşturur"],
    description: "Nova serisi, %60 opak yapısı ile gün ışığını yumuşatarak konforlu bir ortam sağlar. 20 mm pile sıklığı ile düzgün ve estetik bir görünüm sunar.",
    imageUrl: "/fabrics/catalog/nova-beyaz.png",
  },
  {
    id: "neo-fashion",
    name: "Neo Fashion",
    pricePerSqm: 545,
    opacity: 70,
    weight: 150,
    pileFold: 20,
    material: "%100 Polyester",
    warranty: "2 Yıl",
    lifespan: "5 Yıl",
    features: ["Güneş kontrolü", "%50 ısı yalıtımı", "%70 opaklık", "Kolay temizlenir", "Mahremiyet oluşturur"],
    description: "Neo Fashion serisi, %70 opak yapısı ile gün ışığını yumuşatarak konforlu bir ortam sağlar. Dayanıklı polyester kumaşı sayesinde uzun ömürlü ve kolay temizlenebilir.",
    imageUrl: "/fabrics/catalog/neo-krem-desen.png",
  },
  {
    id: "nano-clean",
    name: "Nano Clean",
    pricePerSqm: 545,
    opacity: 60,
    weight: 140,
    pileFold: 20,
    material: "%100 Polyester",
    warranty: "2 Yıl",
    lifespan: "5 Yıl",
    features: ["Kolay temizlenir", "Leke tutmaz", "%50 ısı yalıtımı", "%60 kapatma", "5 yıl kullanım ömrü"],
    description: "Nano Clean serisi; 140 gr/m² kumaşı, %60 kapatma ve %50 ısı yalıtımıyla kolay temizlenen, uzun ömürlü bir çözüm sunar.",
    imageUrl: "/fabrics/catalog/clean-4.png",
  },
  {
    id: "nano-insulation",
    name: "Nano Insulation",
    pricePerSqm: 645,
    opacity: 70,
    weight: 240,
    pileFold: 20,
    material: "%100 Polyester",
    warranty: "2 Yıl",
    lifespan: "5 Yıl",
    features: ["%50 ısı yalıtımı", "%70 kapatma", "Ses azaltma", "5 yıl kullanım ömrü", "Mahremiyet oluşturur"],
    description: "Nano Insulation serisi; 240 gr/m² kumaşı, %70 kapatma, %50 ısı yalıtımı ve ses azaltma özelliğiyle konforlu bir ortam sunar.",
    imageUrl: "/fabrics/catalog/insulation-1.png",
  },
  {
    id: "nano-pro",
    name: "Nano Pro",
    pricePerSqm: 845,
    opacity: 80,
    weight: 300,
    pileFold: 20,
    material: "%100 Polyester",
    warranty: "2 Yıl",
    lifespan: "6 Yıl",
    features: ["%80–95 kapatma", "%50 ısı yalıtımı", "6 yıl kullanım ömrü", "Premium kalite", "Mahremiyet oluşturur"],
    description: "Nano Pro serisi, renge göre %80–95 ışık kapatma sağlar. 300 gr/m² premium kumaşı ve %50 ısı yalıtımıyla yüksek konfor sunar.",
    imageUrl: "/fabrics/catalog/pro-1.png",
  },
] as const;

export const MOUNT_TYPES = [
  { id: "vidali", name: "Vidalı", description: "Vida ile sabit montaj — PVC cam ve cam balkona uygulanabilir" },
  { id: "kancali", name: "Kancalı", description: "PVC pencere çerçevesine kanca ile montaj — cam balkona uygulanabilir" },
  { id: "yapisma", name: "Yapıştırma", description: "Yapıştırıcı bant ile montaj — PVC cam ve cam balkona uygulanabilir" },
] as const;

export const WINDOW_TYPES = [
  { id: "cam-balkon", name: "Cam Balkon", description: "Katlanır cam balkon sistemi" },
  { id: "pvc-cam", name: "PVC Cam", description: "PVC doğrama pencere" },
  { id: "aluminyum", name: "Alüminyum Doğrama", description: "Alüminyum çerçeve pencere" },
  { id: "standart", name: "Standart Pencere", description: "Klasik pencere" },
  { id: "balkon-kapisi", name: "Balkon Kapısı", description: "Balkon kapısı" },
  { id: "surgulu-kapi", name: "Sürgülü Kapı/Cam", description: "Sürgülü cam kapı ve pencere" },
] as const;

export const PROFILE_COLORS = [
  { id: "beyaz", name: "Beyaz", hex: "#FFFFFF" },
  { id: "krem", name: "Krem", hex: "#F5F0E0" },
  { id: "gumus-gri", name: "Gümüş Gri", hex: "#C0C0C0" },
  { id: "antrasit", name: "Antrasit", hex: "#383838" },
] as const;

// Kasa Tipleri
export const CASE_TYPES = [
  { id: "kalin", name: "Kalın Kasa", description: "Tek cama uygulanır", surchargePerSqm: 0 },
  { id: "slim", name: "Slim Kasa", description: "Çift cama uygulanır", surchargePerSqm: 60 },
] as const;

// Sesli Ölçü Rehberi - Pencere Tipine Göre Talimatlar
export interface MeasurementInstruction {
  windowType: string;
  steps: {
    id: number;
    title: string;
    voiceText: string;
    details: string;
    tips: string[];
  }[];
  mountOptions: string[];
  importantNotes: string[];
}

export const MEASUREMENT_INSTRUCTIONS: MeasurementInstruction[] = [
  {
    windowType: "cam-balkon",
    steps: [
      {
        id: 1,
        title: "Kanat Sayısını Belirleyin",
        voiceText: "Cam balkonunuzdaki kanat sayısını sayın ve not edin. Her kanat için ayrı ölçü alacağız.",
        details: "Cam balkondaki tüm kanatları soldan sağa doğru numaralandırın.",
        tips: ["Soldan sağa doğru numaralandırın", "Açılır kanatları işaretleyin"],
      },
      {
        id: 2,
        title: "Genişlik Ölçüsü Alın",
        voiceText: "Her kanatta cam ölçüsü alınır. Metrenizi camın sol iç kenarından sağ iç kenarına doğru tutun. Cam içinden cam içine ölçün. Açılır kanat, yani kollu veya zincirli olan kanat varsa, o kanattan 2 santimetre enden pay düşülür.",
        details: "Bütün kanatlarda cam ölçüsü alınır. Açılır kanat (kollu veya zincirli) ise 2 cm enden pay düşülür.",
        tips: [
          "Cam içinden cam içine ölçün",
          "Açılır kanattan 2 cm pay düşün",
          "Her kanatı ayrı ayrı ölçün",
          "En küçük ölçüyü referans almayın, her kanat farklı olabilir",
        ],
      },
      {
        id: 3,
        title: "Yükseklik Ölçüsü Alın",
        voiceText: "Yükseklik boyları cam içinden cam içine alınır. Metrenizi camın üst iç kenarından alt iç kenarına doğru tutun. Her kanat için ayrı yükseklik ölçüsü alın ve sırasıyla numaralandırarak kaydedin.",
        details: "Yükseklik boyları cam içinden cam içine alınır. Sırasıyla numaralandırılarak alınır.",
        tips: [
          "Cam içinden cam içine ölçün",
          "Her kanat için ayrı yükseklik alın",
          "Sırasıyla numaralandırın",
        ],
      },
      {
        id: 4,
        title: "Montaj Tipini Seçin",
        voiceText: "Cam balkonlara vidalı, kancalı ve yapıştırma montaj uygulanabilir. Tercihinize göre montaj tipini seçin.",
        details: "Cam balkonlara vidalı, kancalı ve yapıştırma özelliği uygulanabilir.",
        tips: [
          "Vidalı montaj en sağlam seçenektir",
          "Kancalı montaj sökülebilir avantaj sağlar",
          "Yapıştırma montaj iz bırakmaz",
        ],
      },
    ],
    mountOptions: ["vidali", "kancali", "yapisma"],
    importantNotes: [
      "Bütün kanatlarda cam ölçüsü alınır",
      "Açılır kanat (kollu/zincirli) ise 2 cm enden pay düşülür",
      "Yükseklik cam içinden cam içine alınır",
      "Kanatlar sırasıyla numaralandırılır",
    ],
  },
  {
    windowType: "pvc-cam",
    steps: [
      {
        id: 1,
        title: "Pencere Tipini Kontrol Edin",
        voiceText: "PVC pencerenizin tek camlı mı yoksa çift camlı mı olduğunu kontrol edin. Tek cama kalın kasa, çift cama slim kasa uygulanır.",
        details: "Tek cama kalın kasa, çift cama slim kasa uygulanır. Slim kasa farkı metrekare başına 60 TL eklenir.",
        tips: ["Tek cam = Kalın kasa", "Çift cam = Slim kasa (+60 TL/m²)"],
      },
      {
        id: 2,
        title: "Genişlik Ölçüsü Alın",
        voiceText: "PVC camlarda cam içinden cam içine net ölçü yazılır. Pay düşülmez. Metrenizi camın sol iç kenarından sağ iç kenarına doğru tutun ve net ölçüyü kaydedin.",
        details: "Cam içinden cam içine net yazılır. Pay düşülmez.",
        tips: [
          "Cam içinden cam içine ölçün",
          "Pay düşmeyin — net ölçü yazın",
          "Milimetre hassasiyetinde ölçün",
        ],
      },
      {
        id: 3,
        title: "Yükseklik Ölçüsü Alın",
        voiceText: "Yüksekliği de cam içinden cam içine net olarak ölçün. Metrenizi camın üst iç kenarından alt iç kenarına doğru tutun. Pay düşmeden net ölçüyü kaydedin.",
        details: "Cam içinden cam içine net yazılır. Pay düşülmez.",
        tips: [
          "Cam içinden cam içine ölçün",
          "Pay düşmeyin",
          "En az 2 noktadan ölçüm yapın",
        ],
      },
      {
        id: 4,
        title: "Montaj Tipini Seçin",
        voiceText: "PVC camlara vidalı ve yapıştırma montaj uygulanabilir. Tercihinize göre montaj tipini seçin.",
        details: "PVC camlara vidalı ve yapıştırma yapılabilir.",
        tips: [
          "Vidalı montaj en sağlam seçenektir",
          "Yapıştırma montaj iz bırakmaz",
        ],
      },
    ],
    mountOptions: ["vidali", "yapisma"],
    importantNotes: [
      "Cam içinden cam içine net yazılır",
      "Pay düşülmez",
      "Tek cam = Kalın kasa, Çift cam = Slim kasa",
      "Slim kasa farkı: +60 TL/m²",
    ],
  },
  {
    windowType: "aluminyum",
    steps: [
      {
        id: 1,
        title: "Doğrama Tipini Kontrol Edin",
        voiceText: "Alüminyum doğramanızın tek camlı mı yoksa çift camlı mı olduğunu kontrol edin. Tek cama kalın kasa, çift cama slim kasa uygulanır.",
        details: "Tek cama kalın kasa, çift cama slim kasa uygulanır.",
        tips: ["Tek cam = Kalın kasa", "Çift cam = Slim kasa (+60 TL/m²)"],
      },
      {
        id: 2,
        title: "Genişlik Ölçüsü Alın",
        voiceText: "Alüminyum doğramalarda cam içinden cam içine net ölçü yazılır. Pay düşülmez. Metrenizi camın sol iç kenarından sağ iç kenarına doğru tutun.",
        details: "Cam içinden cam içine net yazılır. Pay düşülmez.",
        tips: [
          "Cam içinden cam içine ölçün",
          "Pay düşmeyin — net ölçü yazın",
        ],
      },
      {
        id: 3,
        title: "Yükseklik Ölçüsü Alın",
        voiceText: "Yüksekliği de cam içinden cam içine net olarak ölçün. Pay düşmeden net ölçüyü kaydedin.",
        details: "Cam içinden cam içine net yazılır. Pay düşülmez.",
        tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin"],
      },
      {
        id: 4,
        title: "Montaj Tipini Seçin",
        voiceText: "Alüminyum doğramalara vidalı ve yapıştırma montaj uygulanabilir. Tercihinize göre montaj tipini seçin.",
        details: "Vidalı ve yapıştırma montaj uygulanabilir.",
        tips: ["Vidalı montaj en sağlam seçenektir", "Yapıştırma montaj iz bırakmaz"],
      },
    ],
    mountOptions: ["vidali", "yapisma"],
    importantNotes: [
      "Cam içinden cam içine net yazılır",
      "Pay düşülmez",
      "Tek cam = Kalın kasa, Çift cam = Slim kasa",
      "Slim kasa farkı: +60 TL/m²",
    ],
  },
  {
    windowType: "standart",
    steps: [
      {
        id: 1,
        title: "Pencere Tipini Kontrol Edin",
        voiceText: "Standart pencerenizin tek camlı mı yoksa çift camlı mı olduğunu kontrol edin.",
        details: "Tek cama kalın kasa, çift cama slim kasa uygulanır.",
        tips: ["Tek cam = Kalın kasa", "Çift cam = Slim kasa (+60 TL/m²)"],
      },
      {
        id: 2,
        title: "Genişlik Ölçüsü Alın",
        voiceText: "Cam içinden cam içine net ölçü yazılır. Pay düşülmez. Metrenizi camın sol iç kenarından sağ iç kenarına doğru tutun.",
        details: "Cam içinden cam içine net yazılır.",
        tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin"],
      },
      {
        id: 3,
        title: "Yükseklik Ölçüsü Alın",
        voiceText: "Yüksekliği de cam içinden cam içine net olarak ölçün. Pay düşmeden net ölçüyü kaydedin.",
        details: "Cam içinden cam içine net yazılır.",
        tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin"],
      },
      {
        id: 4,
        title: "Montaj Tipini Seçin",
        voiceText: "Vidalı ve yapıştırma montaj uygulanabilir. Tercihinize göre montaj tipini seçin.",
        details: "Vidalı ve yapıştırma montaj uygulanabilir.",
        tips: ["Vidalı montaj en sağlam seçenektir"],
      },
    ],
    mountOptions: ["vidali", "yapisma"],
    importantNotes: [
      "Cam içinden cam içine net yazılır",
      "Pay düşülmez",
    ],
  },
  {
    windowType: "balkon-kapisi",
    steps: [
      {
        id: 1,
        title: "Kapı Tipini Kontrol Edin",
        voiceText: "Balkon kapınızın tek camlı mı yoksa çift camlı mı olduğunu kontrol edin.",
        details: "Tek cama kalın kasa, çift cama slim kasa uygulanır.",
        tips: ["Tek cam = Kalın kasa", "Çift cam = Slim kasa (+60 TL/m²)"],
      },
      {
        id: 2,
        title: "Genişlik Ölçüsü Alın",
        voiceText: "Cam içinden cam içine net ölçü yazılır. Pay düşülmez.",
        details: "Cam içinden cam içine net yazılır.",
        tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin"],
      },
      {
        id: 3,
        title: "Yükseklik Ölçüsü Alın",
        voiceText: "Yüksekliği de cam içinden cam içine net olarak ölçün.",
        details: "Cam içinden cam içine net yazılır.",
        tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin"],
      },
      {
        id: 4,
        title: "Montaj Tipini Seçin",
        voiceText: "Vidalı ve yapıştırma montaj uygulanabilir.",
        details: "Vidalı ve yapıştırma montaj uygulanabilir.",
        tips: ["Vidalı montaj en sağlam seçenektir"],
      },
    ],
    mountOptions: ["vidali", "yapisma"],
    importantNotes: [
      "Cam içinden cam içine net yazılır",
      "Pay düşülmez",
    ],
  },
];

// Sürgülü Kapı/Cam Ölçü Talimatı
export const SURGULU_KAPI_INSTRUCTION: MeasurementInstruction = {
  windowType: "surgulu-kapi",
  steps: [
    {
      id: 1,
      title: "Cam Tipini Kontrol Edin",
      voiceText: "Sürgülü kapı veya cam pencerenizin tek camlı mı yoksa çift camlı mı olduğunu kontrol edin. Tek cama kalın kasa, çift cama slim kasa uygulanır.",
      details: "Tek cama kalın kasa, çift cama slim kasa uygulanır.",
      tips: ["Tek cam = Kalın kasa", "Çift cam = Slim kasa (+60 TL/m²)"],
    },
    {
      id: 2,
      title: "Genişlik Ölçüsü Alın",
      voiceText: "Sürgülü cam veya kapıda cam içinden cam içine net ölçü alınır. Pay düşülmez. Metrenizi camın sol iç kenarından sağ iç kenarına doğru tutun ve net ölçüyü kaydedin.",
      details: "Cam içinden cam içine net yazılır. Pay düşülmez.",
      tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin — net ölçü yazın"],
    },
    {
      id: 3,
      title: "Yükseklik Ölçüsü Alın",
      voiceText: "Yüksekliği de cam içinden cam içine net olarak ölçün. Metrenizi camın üst iç kenarından alt iç kenarına doğru tutun. Pay düşmeden net ölçüyü kaydedin.",
      details: "Cam içinden cam içine net yazılır. Pay düşülmez.",
      tips: ["Cam içinden cam içine ölçün", "Pay düşmeyin"],
    },
    {
      id: 4,
      title: "Montaj Tipini Seçin",
      voiceText: "Sürgülü cam ve kapılara yapıştırma ve vidalı montaj uygulanabilir. Tercihinize göre montaj tipini seçin.",
      details: "Yapıştırma ve vidalı montaj uygulanabilir.",
      tips: ["Vidalı montaj en sağlam seçenektir", "Yapıştırma montaj iz bırakmaz"],
    },
  ],
  mountOptions: ["vidali", "yapisma"],
  importantNotes: [
    "Cam içinden cam içine net yazılır",
    "Pay düşülmez",
    "Yapıştırma ve vidalı montaj uygulanabilir",
  ],
};
