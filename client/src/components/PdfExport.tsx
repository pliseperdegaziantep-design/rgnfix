import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { FABRIC_SERIES, PROFILE_COLORS, MOUNT_TYPES, CASE_TYPES } from "@shared/types";

interface MeasurementItem {
  label: string;
  width: number;
  height: number;
  roundedW: number;
  roundedH: number;
  area: number;
  qty: number;
  price: number;
}

interface PdfExportProps {
  items: MeasurementItem[];
  seriesId: string;
  mountType: string;
  caseType: string;
  profileColor: string;
  totalPrice: string;
  totalArea: string;
  isFreeShipping: boolean;
}

export function PdfExport({ items, seriesId, mountType, caseType, profileColor, totalPrice, totalArea, isFreeShipping }: PdfExportProps) {
  const selectedSeries = FABRIC_SERIES.find(s => s.id === seriesId);
  const selectedMount = MOUNT_TYPES.find(m => m.id === mountType);
  const selectedCase = CASE_TYPES.find(c => c.id === caseType);
  const selectedProfile = PROFILE_COLORS.find(p => p.id === profileColor);

  const generatePdf = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

    // QR Code SVG (basit metin QR - site URL'si)
    const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
      <rect width="100" height="100" fill="white"/>
      <rect x="5" y="5" width="25" height="25" fill="black" rx="2"/>
      <rect x="8" y="8" width="19" height="19" fill="white" rx="1"/>
      <rect x="11" y="11" width="13" height="13" fill="black" rx="1"/>
      <rect x="70" y="5" width="25" height="25" fill="black" rx="2"/>
      <rect x="73" y="8" width="19" height="19" fill="white" rx="1"/>
      <rect x="76" y="11" width="13" height="13" fill="black" rx="1"/>
      <rect x="5" y="70" width="25" height="25" fill="black" rx="2"/>
      <rect x="8" y="73" width="19" height="19" fill="white" rx="1"/>
      <rect x="11" y="76" width="13" height="13" fill="black" rx="1"/>
      <rect x="35" y="5" width="5" height="5" fill="black"/>
      <rect x="45" y="5" width="5" height="5" fill="black"/>
      <rect x="55" y="5" width="5" height="5" fill="black"/>
      <rect x="35" y="15" width="5" height="5" fill="black"/>
      <rect x="50" y="15" width="5" height="5" fill="black"/>
      <rect x="35" y="35" width="5" height="5" fill="black"/>
      <rect x="45" y="35" width="5" height="5" fill="black"/>
      <rect x="55" y="35" width="5" height="5" fill="black"/>
      <rect x="65" y="35" width="5" height="5" fill="black"/>
      <rect x="75" y="35" width="5" height="5" fill="black"/>
      <rect x="35" y="45" width="5" height="5" fill="black"/>
      <rect x="55" y="45" width="5" height="5" fill="black"/>
      <rect x="75" y="45" width="5" height="5" fill="black"/>
      <rect x="35" y="55" width="5" height="5" fill="black"/>
      <rect x="45" y="55" width="5" height="5" fill="black"/>
      <rect x="65" y="55" width="5" height="5" fill="black"/>
      <rect x="85" y="55" width="5" height="5" fill="black"/>
      <rect x="35" y="65" width="5" height="5" fill="black"/>
      <rect x="55" y="65" width="5" height="5" fill="black"/>
      <rect x="65" y="65" width="5" height="5" fill="black"/>
      <rect x="75" y="65" width="5" height="5" fill="black"/>
      <rect x="35" y="75" width="5" height="5" fill="black"/>
      <rect x="55" y="75" width="5" height="5" fill="black"/>
      <rect x="65" y="75" width="5" height="5" fill="black"/>
      <rect x="85" y="75" width="5" height="5" fill="black"/>
      <rect x="35" y="85" width="5" height="5" fill="black"/>
      <rect x="45" y="85" width="5" height="5" fill="black"/>
      <rect x="55" y="85" width="5" height="5" fill="black"/>
      <rect x="65" y="85" width="5" height="5" fill="black"/>
      <rect x="75" y="85" width="5" height="5" fill="black"/>
      <rect x="85" y="85" width="5" height="5" fill="black"/>
    </svg>`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RGNFIX - Fiyat Teklifi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 900; color: #0D1B2A; }
    .logo span { color: #0096D6; }
    .date { text-align: right; font-size: 12px; color: #666; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .info-item { display: flex; justify-content: space-between; padding: 6px 0; }
    .info-label { color: #666; }
    .info-value { font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 8px 12px; text-align: left; border: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; font-size: 12px; }
    td { font-size: 13px; }
    .total-row { background: #f0f0ff; font-weight: 700; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-text { font-size: 11px; color: #666; }
    .qr { text-align: right; }
    .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-top: 16px; font-size: 12px; color: #92400e; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">RGN<span>FIX</span></div>
      <p style="font-size:12px;color:#666;margin-top:4px;">Akıllı Ölçü ve Demonte Ürün Platformu</p>
    </div>
    <div class="date">
      <p><strong>Fiyat Teklifi</strong></p>
      <p>${dateStr}</p>
      <p>${timeStr}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ürün Detayları</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Kumaş Serisi:</span><span class="info-value">${selectedSeries?.name || "-"}</span></div>
      <div class="info-item"><span class="info-label">Birim Fiyat:</span><span class="info-value">${selectedSeries?.pricePerSqm || 0} ₺/m²</span></div>
      <div class="info-item"><span class="info-label">Kasa Tipi:</span><span class="info-value">${selectedCase?.name || "-"}</span></div>
      <div class="info-item"><span class="info-label">Montaj Tipi:</span><span class="info-value">${selectedMount?.name || "-"}</span></div>
      <div class="info-item"><span class="info-label">Profil Rengi:</span><span class="info-value">${selectedProfile?.name || "-"}</span></div>
      <div class="info-item"><span class="info-label">Toplam Alan:</span><span class="info-value">${totalArea} m²</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ölçü Detayları</div>
    <table>
      <thead>
        <tr>
          <th>Pencere</th>
          <th>Ölçü (cm)</th>
          <th>Yuvarlama</th>
          <th>Alan (m²)</th>
          <th>Adet</th>
          <th>Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
        <tr>
          <td>${item.label}</td>
          <td>${item.width} x ${item.height}</td>
          <td>${item.roundedW} x ${item.roundedH}</td>
          <td>${item.area.toFixed(2)}</td>
          <td>${item.qty}</td>
          <td>${item.price.toLocaleString("tr-TR")} ₺</td>
        </tr>`).join("")}
        <tr class="total-row">
          <td colspan="4">TOPLAM</td>
          <td>${items.reduce((s, i) => s + i.qty, 0)}</td>
          <td>${parseFloat(totalPrice).toLocaleString("tr-TR")} ₺</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${isFreeShipping ? '<div class="note">🚚 3.000 ₺ üzeri sipariş — Kargo ücretsizdir.</div>' : ''}

  <div class="note">
    📐 Ölçüler 5'in katına yuvarlanır. Minimum hesaplama birimi 1 m²'dir.
    ${caseType === "slim" ? " Slim kasa farkı m² başına +60 ₺ dahildir." : ""}
  </div>

  <div class="footer">
    <div class="footer-text">
      <p><strong>RGNFIX</strong> — Ölçüne Özel. Kurmaya Hazır.</p>
      <p>İletişim: 0530 028 8903 | Gaziantep</p>
      <p style="margin-top:4px;font-size:10px;">Bu teklif bilgilendirme amaçlıdır. Fiyatlar değişiklik gösterebilir.</p>
    </div>
    <div class="qr">${qrSvg}</div>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <Button variant="outline" onClick={generatePdf} className="w-full gap-2 text-sm">
      <FileDown className="h-4 w-4" />
      PDF Olarak İndir
    </Button>
  );
}
