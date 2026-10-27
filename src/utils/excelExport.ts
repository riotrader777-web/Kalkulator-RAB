/**
 * Excel Export Utility for Indonesian Construction RAB Application
 * Produces structured, styled spreadsheets compatible with Microsoft Excel, Google Sheets & WPS Office.
 * 
 * Supports Dual Output:
 * 1. exportClientRABToExcel: Clean offer letter without exposing contractor cost breakdown or margin.
 * 2. exportInternalRABToExcel: Complete field procurement & budgeting document (Takeoff, Labor, Cash Flow).
 */

import { SavedProject, CalculationBreakdown } from '../types/rab';
import { formatNumber, formatRupiah, isLaborOnlyScope, getScopeModeMetadata } from './calculator';

function triggerExcelDownload(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const EXCEL_STYLES = `
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
    th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 8px 10px; text-align: left; }
    th.text-center { text-align: center; }
    th.text-right { text-align: right; }
    td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: middle; }
    td.text-center { text-align: center; }
    td.text-right { text-align: right; }
    td.font-bold { font-weight: bold; }
    tr.division-header td { background-color: #f1f5f9; font-weight: bold; color: #0f172a; border-top: 2px solid #64748b; }
    tr.subtotal-row td { background-color: #f8fafc; font-weight: bold; }
    tr.grandtotal-row td { background-color: #0f172a; color: #ffffff; font-weight: bold; font-size: 12pt; border: 2px solid #0f172a; }
    .badge { padding: 3px 6px; font-size: 9pt; font-weight: bold; border-radius: 4px; }
    .title-banner { font-size: 16pt; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
    .subtitle-banner { font-size: 10pt; color: #64748b; margin-bottom: 16px; }
    .info-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; margin-bottom: 20px; }
    .info-label { color: #64748b; font-size: 10pt; }
    .info-value { font-weight: bold; color: #0f172a; }
  </style>
`;

/**
 * 1. EXPORT RAB VERSI KLIEN (Surat Penawaran Resmi Tanpa HPP/Margin)
 */
export function exportClientRABToExcel(project: SavedProject, calc: CalculationBreakdown) {
  const isLaborOnly = isLaborOnlyScope(project.scopeMode);
  const metadata = getScopeModeMetadata(project.scopeMode);
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const divisions = calc.ahspDivisions || [];

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>RAB Penawaran Klien</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        ${EXCEL_STYLES}
      </head>
      <body>
        <div class="title-banner">SURAT PENAWARAN & RENCANA ANGGARAN BIAYA (RAB)</div>
        <div class="subtitle-banner">Jasa Kontraktor & Renovasi Bangunan Rumah Tinggal · Standar Mutu SNI</div>

        <!-- Project & Client Metadata -->
        <table style="width: 100%; border: none; margin-bottom: 20px;">
          <tr style="border: none;">
            <td style="border: none; width: 50%; vertical-align: top;">
              <table style="width: 100%;">
                <tr><th colspan="2" style="background-color: #334155;">INFORMASI PROYEK</th></tr>
                <tr><td class="info-label" style="width: 40%;">Nama Proyek</td><td class="info-value">${project.name}</td></tr>
                <tr><td class="info-label">Pemilik / Klien</td><td class="info-value">${project.clientName || 'Bapak / Ibu Pemilik'}</td></tr>
                <tr><td class="info-label">Lokasi Bangunan</td><td>${project.location || 'Sesuai Lokasi Proyek'}</td></tr>
                <tr><td class="info-label">Tanggal Penawaran</td><td>${dateStr}</td></tr>
                <tr><td class="info-label">Nomor Dokumen</td><td>RAB/${new Date().getFullYear()}/${project.id.slice(-6).toUpperCase()}</td></tr>
              </table>
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
              <table style="width: 100%;">
                <tr><th colspan="2" style="background-color: #334155;">SPESIFIKASI BANGUNAN</th></tr>
                <tr><td class="info-label" style="width: 40%;">Tipe Bangunan</td><td class="info-value">Rumah ${project.floors} Lantai (${project.houseLength}m x ${project.houseWidth}m)</td></tr>
                <tr><td class="info-label">Total Luas Bangunan</td><td class="info-value">${calc.totalBuildingArea} m² (Tinggi Dinding ${calc.wallHeight}m)</td></tr>
                <tr><td class="info-label">Jenis Pondasi</td><td>${calc.foundationType === 'cakar_ayam' ? 'Cakar Ayam Tulangan Dobel Grid' : calc.foundationType === 'footplat' ? 'Footplat Telapak Beton' : calc.foundationType === 'strauss_pile' ? 'Strauss Pile Tiang Bor' : 'Batu Kali Menerus'}</td></tr>
                <tr><td class="info-label">Dinding & Plafon</td><td>${project.wallType === 'hebel' ? 'Bata Ringan Hebel' : 'Bata Merah'} · Plafon ${calc.ceilingType === 'pvc' ? 'PVC Tahan Air' : 'Gypsum 9mm'}</td></tr>
                <tr><td class="info-label">Skema Penawaran</td><td style="color: #b45309; font-weight: bold;">${metadata.title}</td></tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- I. REKAPITULASI DIVISI AHSP PENAWARAN KLIEN -->
        <h3 style="color: #0f172a; margin-bottom: 8px;">I. REKAPITULASI BIAYA PENAWARAN (5 DIVISI PEKERJAAN)</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 8%;">No</th>
              <th style="width: 52%;">Uraian Divisi Pekerjaan</th>
              <th class="text-center" style="width: 15%;">Status</th>
              <th class="text-right" style="width: 25%;">Jumlah Penawaran (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${divisions.map((div, idx) => {
              const roman = ['I', 'II', 'III', 'IV', 'V'][idx] || `${idx + 1}`;
              return `
                <tr>
                  <td class="text-center font-bold">${roman}</td>
                  <td class="font-bold">${div.title}</td>
                  <td class="text-center"><span style="color: #059669; font-weight: bold;">Termasuk</span></td>
                  <td class="text-right font-bold">${formatRupiah(div.clientTotalCost)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="grandtotal-row">
              <td colspan="3" class="text-right">TOTAL HARGA PENAWARAN (GRAND TOTAL):</td>
              <td class="text-right" style="color: #fde047;">${formatRupiah(calc.grandTotal)}</td>
            </tr>
            <tr style="background-color: #f8fafc; font-weight: bold;">
              <td colspan="3" class="text-right">Harga Rata-Rata Per Meter Persegi (Luas ${calc.totalBuildingArea} m²):</td>
              <td class="text-right" style="color: #0f172a;">${formatRupiah(calc.costPerM2)} / m²</td>
            </tr>
          </tfoot>
        </table>

        <!-- II. RINCIAN BILL OF QUANTITIES (BoQ) RESMI KLIEN -->
        <h3 style="color: #0f172a; margin-bottom: 8px; margin-top: 30px;">II. RINCIAN DETAIL PEKERJAAN & HARGA SATUAN PENAWARAN (BoQ)</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 6%;">No</th>
              <th style="width: 44%;">Uraian Item Pekerjaan Konstruksi</th>
              <th class="text-right" style="width: 12%;">Volume</th>
              <th class="text-center" style="width: 8%;">Satuan</th>
              <th class="text-right" style="width: 15%;">Harga Satuan (Rp)</th>
              <th class="text-right" style="width: 15%;">Total Harga (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${divisions.map((div, divIdx) => {
              const roman = ['I', 'II', 'III', 'IV', 'V'][divIdx] || `${divIdx + 1}`;
              const rows = div.items.map((item, itemIdx) => `
                <tr>
                  <td class="text-center">${divIdx + 1}.${itemIdx + 1}</td>
                  <td>${item.name}</td>
                  <td class="text-right">${formatNumber(item.volume)}</td>
                  <td class="text-center">${item.unit}</td>
                  <td class="text-right">${formatRupiah(item.clientUnitPrice)}</td>
                  <td class="text-right font-bold">${formatRupiah(item.clientTotalCost)}</td>
                </tr>
              `).join('');

              return `
                <tr class="division-header">
                  <td class="text-center">${roman}</td>
                  <td colspan="4">${div.title.toUpperCase()}</td>
                  <td class="text-right">${formatRupiah(div.clientTotalCost)}</td>
                </tr>
                ${rows}
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="grandtotal-row">
              <td colspan="5" class="text-right">TOTAL HARGA PENAWARAN (GRAND TOTAL):</td>
              <td class="text-right" style="color: #fde047;">${formatRupiah(calc.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- III. SKEMA TERMIN PEMBAYARAN -->
        <h3 style="color: #0f172a; margin-bottom: 8px; margin-top: 30px;">III. RENCANA TAHAPAN PEMBAYARAN (TERMIN KERJA)</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 10%;">Tahapan</th>
              <th style="width: 25%;">Persentase (%)</th>
              <th class="text-right" style="width: 25%;">Nominal Pembayaran (Rp)</th>
              <th style="width: 40%;">Prestasi Fisik & Deskripsi Lapangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center font-bold">Termin 1</td>
              <td>Uang Muka (DP) 30%</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.30)}</td>
              <td>Saat penandatanganan SPK / MoU & mobilisasi awal tukang serta material pondasi</td>
            </tr>
            <tr>
              <td class="text-center font-bold">Termin 2</td>
              <td>Progress Fisik 30%</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.30)}</td>
              <td>Pekerjaan pondasi, sloof, kolom beton bertulang & pasangan dinding bata selesai</td>
            </tr>
            <tr>
              <td class="text-center font-bold">Termin 3</td>
              <td>Progress Fisik 35%</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.35)}</td>
              <td>Rangka atap baja ringan, penutup genteng, plesteran, acian & plafon selesai</td>
            </tr>
            <tr>
              <td class="text-center font-bold">Termin 4</td>
              <td>Pelunasan 5%</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.05)}</td>
              <td>Serah terima kunci rumah, finishing akhir & masa retensi pemeliharaan 30 hari kalender</td>
            </tr>
          </tbody>
        </table>

        <!-- IV. SYARAT & KETENTUAN -->
        <div style="margin-top: 24px; font-size: 10pt; color: #475569;">
          <strong>Ketentuan Pelaksanaan:</strong><br/>
          1. Harga penawaran berlaku selama 30 (tiga puluh) hari kalender sejak tanggal penawaran diterbitkan.<br/>
          2. Perubahan pekerjaan (tambah/kurang) akan dihitung berdasarkan Berita Acara Pekerjaan Tambah Kurang (CCO).<br/>
          3. Garansi pemeliharaan konstruksi berlaku selama 30 hari kalender setelah serah terima pekerjaan.
        </div>

        <!-- V. SIGNATURE BLOCKS -->
        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr style="border: none;">
            <td style="border: none; width: 50%; text-align: center;">
              <div>Diajukan Oleh:</div>
              <div style="font-weight: bold; margin-bottom: 60px;">Kontraktor / Pemborong Pelaksana</div>
              <div>( .................................................... )</div>
            </td>
            <td style="border: none; width: 50%; text-align: center;">
              <div>Disetujui Oleh:</div>
              <div style="font-weight: bold; margin-bottom: 60px;">Pemilik Rumah / Pemberi Tugas</div>
              <div>( ${project.clientName || '....................................................'} )</div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const cleanName = (project.name || 'Proyek_Rumah').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerExcelDownload(html, `RAB_Penawaran_Klien_${cleanName}.xls`);
}

/**
 * 2. EXPORT RAB VERSI INTERNAL PEMBORONG (Lengkap Modal Bahan, Upah, Margin & Belanja Lapangan)
 */
export function exportInternalRABToExcel(project: SavedProject, calc: CalculationBreakdown) {
  const isLaborOnly = isLaborOnlyScope(project.scopeMode);
  const metadata = getScopeModeMetadata(project.scopeMode);
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const divisions = calc.ahspDivisions || [];
  const materials = calc.materialRequirements || [];

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>HPP & Analisa Lapangan</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        ${EXCEL_STYLES}
      </head>
      <body>
        <div style="background-color: #991b1b; color: white; padding: 6px 12px; font-weight: bold; font-size: 10pt; display: inline-block; margin-bottom: 8px;">
          DOKUMEN RAHASIA INTERNAL PEMBORONG - ACUAN BELANJA MATERIAL & UPAH TUKANG
        </div>
        <div class="title-banner">LEMBAR ANGGARAN & ESTIMASI BIAYA INTERNAL (HPP)</div>
        <div class="subtitle-banner">Proyek: ${project.name} · Pemilik: ${project.clientName || 'Klien'} · Tanggal: ${dateStr}</div>

        <!-- FINANCIAL DASHBOARD (PEMBORONG MARGIN SUMMARY) -->
        <table style="width: 100%; margin-bottom: 24px;">
          <tr>
            <th colspan="4" style="background-color: #0f172a;">RINGKASAN FINANSIAL & PROFIT MARGIN KONTRAKTOR</th>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="width: 25%;">
              <div class="info-label">TOTAL HARGA PENAWARAN (KONTRAK):</div>
              <div style="font-size: 14pt; font-weight: bold; color: #0284c7;">${formatRupiah(calc.grandTotal)}</div>
            </td>
            <td style="width: 25%;">
              <div class="info-label">MODAL POKOK RIIL (HPP LAPANGAN):</div>
              <div style="font-size: 14pt; font-weight: bold; color: #dc2626;">${formatRupiah(calc.baseCost)}</div>
            </td>
            <td style="width: 25%;">
              <div class="info-label">ESTIMASI LABA KONTRAKTOR (${calc.profitMarginPercent}%):</div>
              <div style="font-size: 14pt; font-weight: bold; color: #16a34a;">${formatRupiah(calc.profitAmount)}</div>
            </td>
            <td style="width: 25%;">
              <div class="info-label">DANA CADANGAN TAK TERDUGA (${calc.contingencyPercent}%):</div>
              <div style="font-size: 14pt; font-weight: bold; color: #d97706;">${formatRupiah(calc.contingencyAmount)}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="background-color: #fffbeb;">
              <strong>Rincian Modal Bahan Material:</strong> ${formatRupiah(calc.totalMaterialCost)} (${calc.baseCost > 0 ? Math.round((calc.totalMaterialCost / calc.baseCost) * 100) : 0}% dari HPP)
            </td>
            <td colspan="2" style="background-color: #eff6ff;">
              <strong>Rincian Modal Upah Tukang & Mandor:</strong> ${formatRupiah(calc.totalLaborCost)} (${calc.baseCost > 0 ? Math.round((calc.totalLaborCost / calc.baseCost) * 100) : 0}% dari HPP)
            </td>
          </tr>
        </table>

        <!-- I. ANALISA HPP LAPANGAN (BAHAN vs UPAH PER PEKERJAAN) -->
        <h3 style="color: #0f172a; margin-bottom: 8px;">I. ANALISA RINCIAN HPP PER DIVISI (MODAL MATERIAL VS UPAH KERJA)</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 5%;">No</th>
              <th style="width: 35%;">Uraian Pekerjaan & Standar SNI</th>
              <th class="text-right" style="width: 8%;">Volume</th>
              <th class="text-center" style="width: 6%;">Sat</th>
              <th class="text-right" style="width: 11%;">Biaya Bahan (Rp)</th>
              <th class="text-right" style="width: 11%;">Biaya Upah (Rp)</th>
              <th class="text-right" style="width: 12%;">HPP Satuan (Rp)</th>
              <th class="text-right" style="width: 12%;">Total HPP (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${divisions.map((div, divIdx) => {
              const roman = ['I', 'II', 'III', 'IV', 'V'][divIdx] || `${divIdx + 1}`;
              const rows = div.items.map((item, itemIdx) => `
                <tr>
                  <td class="text-center">${divIdx + 1}.${itemIdx + 1}</td>
                  <td>${item.name} <span style="color: #64748b; font-size: 9pt;">(${item.codeSNI})</span></td>
                  <td class="text-right">${formatNumber(item.volume)}</td>
                  <td class="text-center">${item.unit}</td>
                  <td class="text-right">${formatRupiah(item.materialUnitCost)}</td>
                  <td class="text-right">${formatRupiah(item.laborUnitCost)}</td>
                  <td class="text-right font-bold">${formatRupiah(item.unitPrice)}</td>
                  <td class="text-right font-bold">${formatRupiah(item.totalCost)}</td>
                </tr>
              `).join('');

              return `
                <tr class="division-header">
                  <td class="text-center">${roman}</td>
                  <td colspan="3">${div.title.toUpperCase()}</td>
                  <td class="text-right">${formatRupiah(div.totalMaterialCost)}</td>
                  <td class="text-right">${formatRupiah(div.totalLaborCost)}</td>
                  <td>-</td>
                  <td class="text-right">${formatRupiah(div.totalHPP)}</td>
                </tr>
                ${rows}
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f1f5f9; font-weight: bold;">
              <td colspan="4" class="text-right">TOTAL MODAL POKOK (HPP):</td>
              <td class="text-right">${formatRupiah(calc.totalMaterialCost)}</td>
              <td class="text-right">${formatRupiah(calc.totalLaborCost)}</td>
              <td>-</td>
              <td class="text-right font-bold" style="color: #dc2626;">${formatRupiah(calc.baseCost)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- II. DAFTAR BELANJA KEBUTUHAN MATERIAL LAPANGAN (MATERIAL TAKEOFF) -->
        <h3 style="color: #0f172a; margin-bottom: 8px; margin-top: 30px;">II. DAFTAR BELANJA KEBUTUHAN MATERIAL LAPANGAN (LOGISTIK & DROPPING)</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 5%;">No</th>
              <th style="width: 40%;">Nama Material & Spesifikasi Teknis</th>
              <th class="text-center" style="width: 15%;">Kategori</th>
              <th class="text-right" style="width: 12%;">Kebutuhan Fisik</th>
              <th class="text-center" style="width: 8%;">Satuan</th>
              <th class="text-right" style="width: 10%;">Estimasi Harga</th>
              <th class="text-right" style="width: 10%;">Total Anggaran</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map((m, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="font-bold">${m.name} ${m.notes ? `<div style="font-size: 9pt; color: #64748b; font-weight: normal;">Catatan: ${m.notes}</div>` : ''}</td>
                <td class="text-center">${m.category.replace('_', ' ').toUpperCase()}</td>
                <td class="text-right font-bold" style="color: #b45309;">${formatNumber(m.quantity)}</td>
                <td class="text-center font-bold">${m.unit}</td>
                <td class="text-right">${formatRupiah(m.unitPrice)}</td>
                <td class="text-right font-bold">${formatRupiah(m.totalCost)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="subtotal-row">
              <td colspan="6" class="text-right">TOTAL BUDGET BELANJA MATERIAL LAPANGAN:</td>
              <td class="text-right font-bold" style="color: #b45309;">${formatRupiah(calc.totalMaterialCost)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- III. ALOKASI UPAH KERJA BORONGAN TUKANG LAPANGAN -->
        <h3 style="color: #0f172a; margin-bottom: 8px; margin-top: 30px;">III. ALOKASI UPAH KERJA BORONGAN / HARIAN TUKANG & MANDOR</h3>
        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 8%;">Divisi</th>
              <th style="width: 42%;">Bidang Pekerjaan Lapangan</th>
              <th style="width: 25%;">Alokasi Tenaga Terlibat</th>
              <th class="text-right" style="width: 25%;">Plafon Anggaran Upah (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${divisions.map((div, idx) => `
              <tr>
                <td class="text-center font-bold">${idx + 1}</td>
                <td class="font-bold">${div.title}</td>
                <td>Pekerja, Tukang & Mandor Terkait</td>
                <td class="text-right font-bold" style="color: #0284c7;">${formatRupiah(div.totalLaborCost)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="subtotal-row">
              <td colspan="3" class="text-right">TOTAL ALOKASI UPAH TENAGA KERJA:</td>
              <td class="text-right font-bold" style="color: #0284c7;">${formatRupiah(calc.totalLaborCost)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- IV. RENCANA CASH FLOW PENGELUARAN BELANJA PER TERMIN -->
        <h3 style="color: #0f172a; margin-bottom: 8px; margin-top: 30px;">IV. ARUS KAS (CASH FLOW) BELANJA LAPANGAN PER TERMIN PENARIKAN</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 15%;">Termin Penarikan</th>
              <th class="text-right" style="width: 20%;">Pemasukan Termin (Rp)</th>
              <th style="width: 35%;">Alokasi Belanja & Upah Lapangan</th>
              <th class="text-right" style="width: 15%;">Target Pengeluaran</th>
              <th class="text-right" style="width: 15%;">Sisa Cadangan Kas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="font-bold">Termin 1 (DP 30%)</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.30)}</td>
              <td>Pembersihan, bowplank, galian, semen 50kg & pasir pondasi, besi tapak/sloof</td>
              <td class="text-right">${formatRupiah(calc.baseCost * 0.28)}</td>
              <td class="text-right font-bold" style="color: #16a34a;">${formatRupiah((calc.grandTotal * 0.30) - (calc.baseCost * 0.28))}</td>
            </tr>
            <tr>
              <td class="font-bold">Termin 2 (Progress 30%)</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.30)}</td>
              <td>Pengecoran kolom/balok/dak lantai 2, bata hebel/merah & upah tukang pasang</td>
              <td class="text-right">${formatRupiah(calc.baseCost * 0.32)}</td>
              <td class="text-right font-bold" style="color: #16a34a;">${formatRupiah((calc.grandTotal * 0.30) - (calc.baseCost * 0.32))}</td>
            </tr>
            <tr>
              <td class="font-bold">Termin 3 (Progress 35%)</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.35)}</td>
              <td>Rangka baja ringan, genteng, semen acian 50kg, plafon, keramik & cat tembok</td>
              <td class="text-right">${formatRupiah(calc.baseCost * 0.35)}</td>
              <td class="text-right font-bold" style="color: #16a34a;">${formatRupiah((calc.grandTotal * 0.35) - (calc.baseCost * 0.35))}</td>
            </tr>
            <tr>
              <td class="font-bold">Termin 4 (Pelunasan 5%)</td>
              <td class="text-right font-bold">${formatRupiah(calc.grandTotal * 0.05)}</td>
              <td>Finishing sentuhan akhir, pembersihan serah terima & laba pemborong akhir</td>
              <td class="text-right">${formatRupiah(calc.baseCost * 0.05)}</td>
              <td class="text-right font-bold" style="color: #16a34a;">${formatRupiah((calc.grandTotal * 0.05) - (calc.baseCost * 0.05))}</td>
            </tr>
          </tbody>
        </table>

        <!-- V. TANDA TANGAN TIM KONTRAKTOR -->
        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr style="border: none;">
            <td style="border: none; width: 33%; text-align: center;">
              <div>Dihitung Oleh:</div>
              <div style="font-weight: bold; margin-bottom: 60px;">Estimator / Quantity Surveyor (QS)</div>
              <div>( .................................................... )</div>
            </td>
            <td style="border: none; width: 33%; text-align: center;">
              <div>Diawasi Lapangan:</div>
              <div style="font-weight: bold; margin-bottom: 60px;">Mandor / Kepala Pelaksana Proyek</div>
              <div>( .................................................... )</div>
            </td>
            <td style="border: none; width: 34%; text-align: center;">
              <div>Disahkan Oleh:</div>
              <div style="font-weight: bold; margin-bottom: 60px;">Direktur / Pemborong Utama</div>
              <div>( .................................................... )</div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const cleanName = (project.name || 'Proyek_Rumah').replace(/[^a-zA-Z0-9_-]/g, '_');
  triggerExcelDownload(html, `RAB_Internal_Pemborong_${cleanName}.xls`);
}
