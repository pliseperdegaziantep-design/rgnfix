import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { FABRIC_SERIES, PROFILE_COLORS, MOUNT_TYPES, CASE_TYPES } from "@shared/types";

interface MeasurementItem {
  label: string;
  width: number;
  height: number;
  area: number;
  qty: number;
  price: number;
}

interface PdfExportProps {
  items: MeasurementItem[];
  seriesId: string;
  fabricVariant: string;
  mountType: string;
  caseType: string;
  profileColor: string;
  totalPrice: string;
  isFreeShipping: boolean;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function PdfExport({
  items,
  seriesId,
  fabricVariant,
  mountType,
  caseType,
  profileColor,
  totalPrice,
  isFreeShipping,
}: PdfExportProps) {
  const selectedSeries = FABRIC_SERIES.find(series => series.id === seriesId);
  const selectedMount = MOUNT_TYPES.find(mount => mount.id === mountType);
  const selectedCase = CASE_TYPES.find(caseOption => caseOption.id === caseType);
  const selectedProfile = PROFILE_COLORS.find(profile => profile.id === profileColor);

  const generatePdf = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>RGNFIX - Fiyat Teklifi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 36px; color: #173434; font-size: 14px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #173434; padding-bottom: 18px; }
    .logo { font-size: 26px; font-weight: 900; }
    .logo span { color: #1a9b9b; }
    .date { text-align: right; font-size: 12px; color: #667777; line-height: 1.5; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #d7e1e1; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .info-item { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px dotted #d7e1e1; }
    .info-label { color: #667777; }
    .info-value { font-weight: 700; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { padding: 9px 10px; text-align: left; border: 1px solid #d7e1e1; }
    th { background: #f3f7f7; font-size: 12px; }
    td { font-size: 13px; }
    .total { margin-top: 18px; display: flex; justify-content: space-between; padding: 16px; background: #edf7f7; border: 1px solid #c6dddd; font-size: 18px; font-weight: 800; }
    .note { margin-top: 14px; padding: 10px 12px; background: #f7faf9; border: 1px solid #d7e1e1; border-radius: 8px; font-size: 12px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #d7e1e1; font-size: 11px; color: #667777; line-height: 1.5; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">RGN<span>FIX</span></div>
      <p style="font-size:12px;color:#667777;margin-top:4px;">Ölçüne Özel. Kurmaya Hazır.</p>
    </div>
    <div class="date"><strong>Fiyat Teklifi</strong><br>${escapeHtml(dateStr)}<br>${escapeHtml(timeStr)}</div>
  </div>

  <div class="section">
    <div class="section-title">Ürün Bilgileri</div>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Kumaş:</span><span class="info-value">${escapeHtml(selectedSeries?.name || "-")}</span></div>
      <div class="info-item"><span class="info-label">Varyant:</span><span class="info-value">${escapeHtml(fabricVariant || "-")}</span></div>
      <div class="info-item"><span class="info-label">Kasa:</span><span class="info-value">${escapeHtml(selectedCase?.name || "-")}</span></div>
      <div class="info-item"><span class="info-label">Montaj:</span><span class="info-value">${escapeHtml(selectedMount?.name || "-")}</span></div>
      <div class="info-item"><span class="info-label">Profil:</span><span class="info-value">${escapeHtml(selectedProfile?.name || "-")}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Ölçüler</div>
    <table>
      <thead><tr><th>Parça</th><th>EN × BOY</th><th>Adet</th><th>Tutar</th></tr></thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>${escapeHtml(item.label)}</td>
            <td>${escapeHtml(item.width)} × ${escapeHtml(item.height)} cm</td>
            <td>${escapeHtml(item.qty)}</td>
            <td>${escapeHtml(Math.round(item.price).toLocaleString("tr-TR"))} ₺</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>

  <div class="total"><span>TOPLAM</span><span>${escapeHtml(Number(totalPrice).toLocaleString("tr-TR"))} ₺</span></div>
  ${isFreeShipping ? '<div class="note">Kargo ücretsizdir.</div>' : ''}

  <div class="footer">
    <strong>RGNFIX</strong><br>
    +90 530 028 89 03 · Gaziantep<br>
    Bu teklif bilgilendirme amaçlıdır.
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    window.setTimeout(() => printWindow.print(), 500);
  };

  if (!items || items.length === 0) return null;

  return (
    <Button variant="outline" onClick={generatePdf} className="w-full gap-2 text-sm">
      <FileDown className="h-4 w-4" />
      PDF Olarak İndir
    </Button>
  );
}
