import React, { useState } from 'react';
import { SavedProject, CalculationBreakdown } from '../types/rab';
import { formatNumber, formatRupiah, isLaborOnlyScope, getScopeModeMetadata } from '../utils/calculator';
import { exportClientRABToExcel, exportInternalRABToExcel } from '../utils/excelExport';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  FileSpreadsheet, 
  UserCheck, 
  Building, 
  HardHat, 
  Package, 
  Coins, 
  CalendarClock, 
  CheckCircle,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface PrintableRABReportProps {
  project: SavedProject;
  calculation: CalculationBreakdown;
}

export const PrintableRABReport: React.FC<PrintableRABReportProps> = ({
  project,
  calculation,
}) => {
  const [reportMode, setReportMode] = useState<'client' | 'internal'>('client');

  const isLaborOnly = isLaborOnlyScope(project.scopeMode);
  const totalArea = calculation.totalBuildingArea;
  const metadata = getScopeModeMetadata(project.scopeMode);
  const scopeTitle = metadata.title;
  const divisions = calculation.ahspDivisions || [];
  const materials = calculation.materialRequirements || [];

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (reportMode === 'client') {
      exportClientRABToExcel(project, calculation);
    } else {
      exportInternalRABToExcel(project, calculation);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Dual Output Mode Toggle & Print/Export Buttons) */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Dual Mode Switcher */}
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            PILIHAN FORMAT LAPORAN (DUAL OUTPUT VERSION):
          </div>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setReportMode('client')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                reportMode === 'client'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className={`w-3.5 h-3.5 ${reportMode === 'client' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Versi Klien (Penawaran Resmi)</span>
            </button>
            <button
              type="button"
              onClick={() => setReportMode('internal')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                reportMode === 'internal'
                  ? 'bg-slate-900 text-amber-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className={`w-3.5 h-3.5 ${reportMode === 'internal' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Versi Internal Pemborong (HPP & Belanja)</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: PDF & Excel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xls) {reportMode === 'client' ? 'Klien' : 'Internal'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak / PDF {reportMode === 'client' ? 'Penawaran' : 'RAB Lapangan'}</span>
          </button>
        </div>
      </div>

      {/* Mode Banner Indicator */}
      <div className="no-print">
        {reportMode === 'client' ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Mode Versi Klien Aktif:</strong> Format dokumen penawaran resmi yang rapi untuk diserahkan ke pemilik rumah.
              Hanya menampilkan item pekerjaan, volume, satuan, dan harga total penawaran. Modal material, upah tukang, dan margin profit kontraktor <span className="underline font-semibold">disembunyikan secara aman</span>.
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded-lg text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Mode Versi Internal Pemborong Aktif:</strong> Dokumen rahasia pelaksanaan lapangan untuk kontraktor, site manager & mandor.
              Menampilkan rincian Modal Pokok HPP, estimasi profit bersih, daftar belanja kebutuhan material (kebutuhan sak semen 50kg, pasir m³, besi beton batang), dan alokasi upah tukang per divisi.
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE SHEET CONTAINER (A4 Styled Layout) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-sm text-slate-900 font-sans print-shadow-none print:p-0 print:border-none">
        
        {/* ========================= HEADER / KOP SURAT ========================= */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <span>RAB PRO · KONTRAKTOR & ESTIMATOR BANGUNAN</span>
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Spesialis Konstruksi Rumah Tinggal 1 & 2 Lantai · Ruko · Renovasi & Bangun Baru
            </div>
            <div className="text-xs text-slate-500">
              Telp / WhatsApp: 0812-XXXX-XXXX · Email: kontak@rabrumahpro.id · Standar AHSP PUPR
            </div>
          </div>

          <div className="text-left sm:text-right text-xs">
            {reportMode === 'client' ? (
              <>
                <div className="font-extrabold text-slate-900 text-sm tracking-wide">
                  SURAT PENAWARAN & RAB
                </div>
                <div className="text-slate-600 font-mono mt-0.5">
                  No: RAB/{new Date().getFullYear()}/{project.id.slice(-6).toUpperCase()}
                </div>
                <div className="text-slate-500">
                  Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-700 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase inline-block mb-1">
                  RAHASIA INTERNAL PEMBORONG
                </div>
                <div className="font-extrabold text-slate-900 text-sm tracking-wide">
                  HPP & ACUAN BELANJA LAPANGAN
                </div>
                <div className="text-slate-600 font-mono">
                  Ref Proyek: {project.id.slice(-6).toUpperCase()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================= INFORMASI PROYEK & SPESIFIKASI ========================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs">
          <div className="space-y-1">
            <div className="text-slate-500 font-medium">Nama Proyek:</div>
            <div className="font-bold text-slate-900 text-sm">{project.name}</div>
            <div className="text-slate-500 pt-1 font-medium">Pemilik / Klien:</div>
            <div className="font-semibold text-slate-800">{project.clientName || 'Bapak / Ibu Pemilik'}</div>
            {project.location && (
              <>
                <div className="text-slate-500 pt-1 font-medium">Lokasi Proyek:</div>
                <div className="text-slate-800">{project.location}</div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-slate-500 font-medium">Spesifikasi Konstruksi:</div>
            <div className="font-semibold text-slate-900">
              Rumah {project.floors} Lantai (Ukuran {project.houseLength}m x {project.houseWidth}m)
            </div>
            <div className="text-slate-700">
              Total Luas Bangunan: <span className="font-bold tabular-nums">{totalArea} m²</span> · Tinggi Dinding: <span className="font-bold tabular-nums">{project.wallHeight} Meter</span>
            </div>
            <div className="text-slate-700">
              Dinding: <span className="font-semibold">{project.wallType === 'hebel' ? 'Bata Ringan Hebel (Mortar Thinbed)' : 'Bata Merah Bakar (Spesi 1:4)'}</span> · Plafon: <span className="font-semibold">{project.ceilingType === 'pvc' ? 'Panel PVC 8mm Tahan Air' : 'Papan Gypsum 9mm'}</span>
            </div>
            <div className="text-slate-700">
              Pondasi: <span className="font-semibold">
                {calculation.foundationType === 'cakar_ayam' ? 'Cakar Ayam Tulangan Dobel Grid' :
                 calculation.foundationType === 'footplat' ? 'Footplat Telapak Beton' :
                 calculation.foundationType === 'strauss_pile' ? 'Strauss Pile Tiang Bor Ø25cm' : 'Batu Kali Menerus'}
                {calculation.foundationPoints > 0 ? ` (${calculation.foundationPoints} Titik · ${calculation.foundationConcreteVol} m³ Cor)` : ''}
              </span>
            </div>
            <div className="text-slate-700">
              Standar Semen: <span className="font-semibold">Portland {project.cementBagWeight || 50}kg & Acian {project.acianBagWeight || 50}kg</span>
            </div>
            <div className="text-slate-500 pt-1 font-medium">Paket Borongan:</div>
            <div className="font-bold text-amber-900">{scopeTitle}</div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: VERSI KLIEN (OFFICIAL CLIENT PROPOSAL) */}
        {/* ========================================================================= */}
        {reportMode === 'client' && (
          <div className="space-y-6">
            {/* I. REKAPITULASI BIAYA PER 5 DIVISI AHSP */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>I. Rekapitulasi Rencana Anggaran Biaya (RAB) Penawaran</span>
                <span className="text-[10px] font-normal text-slate-500">Standar 5 Divisi Konstruksi</span>
              </h4>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3">Uraian Divisi Pekerjaan</th>
                    <th className="py-2.5 px-3 text-center w-28">Status</th>
                    <th className="py-2.5 px-3 text-right w-44">Jumlah Penawaran (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {divisions.map((div, idx) => {
                    const roman = ['I', 'II', 'III', 'IV', 'V'][idx] || `${idx + 1}`;
                    return (
                      <tr key={div.id}>
                        <td className="py-2 px-3 text-center font-mono font-medium">{roman}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{div.title}</div>
                          <div className="text-[10px] text-slate-500">{div.subtitle}</div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800">
                            Termasuk
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatRupiah(div.clientTotalCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 font-semibold bg-slate-50">
                  <tr className="bg-slate-900 text-white font-bold text-sm">
                    <td colSpan={3} className="py-3 px-3 text-right">
                      TOTAL BIAYA PENAWARAN (GRAND TOTAL):
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-300 tabular-nums text-base">
                      {formatRupiah(calculation.grandTotal)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 text-slate-800">
                    <td colSpan={3} className="py-2 px-3 text-right text-xs">
                      Harga Penawaran Rata-Rata Per Meter Persegi (Luas Bangunan {totalArea} m²):
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-xs">
                      {formatRupiah(calculation.costPerM2)} / m²
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* II. RINCIAN BILL OF QUANTITIES (BoQ) RESMI */}
            <div className="print-break-inside-avoid">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>II. Rincian Detail Volume & Harga Satuan Pekerjaan (BoQ)</span>
                <span className="text-[10px] font-normal text-slate-500">Harga Penawaran Resmi</span>
              </h4>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-10 text-center">No</th>
                    <th className="py-2 px-2.5">Uraian Item Pekerjaan</th>
                    <th className="py-2 px-2.5 text-right w-20">Volume</th>
                    <th className="py-2 px-2.5 text-center w-16">Satuan</th>
                    <th className="py-2 px-2.5 text-right w-28">Harga Satuan</th>
                    <th className="py-2 px-2.5 text-right w-36">Jumlah Harga (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {divisions.map((div, divIdx) => {
                    const roman = ['I', 'II', 'III', 'IV', 'V'][divIdx] || `${divIdx + 1}`;
                    return (
                      <React.Fragment key={div.id}>
                        {/* Division Sub-header */}
                        <tr className="bg-slate-100/80 font-bold text-slate-900">
                          <td className="py-2 px-2.5 text-center font-mono">{roman}</td>
                          <td colSpan={4} className="py-2 px-2.5">
                            {div.title.toUpperCase()}
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono">
                            {formatRupiah(div.clientTotalCost)}
                          </td>
                        </tr>
                        {/* Items under division */}
                        {div.items.map((item, itemIdx) => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-center font-mono text-[11px] text-slate-400">
                              {divIdx + 1}.{itemIdx + 1}
                            </td>
                            <td className="py-1.5 px-2.5 pl-5 text-slate-700">
                              {item.name}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono tabular-nums font-medium text-slate-800">
                              {formatNumber(item.volume)}
                            </td>
                            <td className="py-1.5 px-2.5 text-center text-slate-500 font-medium">
                              {item.unit}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono tabular-nums text-slate-600">
                              {formatRupiah(item.clientUnitPrice)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                              {formatRupiah(item.clientTotalCost)}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-900 text-white">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-2.5 text-right text-xs">
                      TOTAL BIAYA PENAWARAN (GRAND TOTAL):
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-amber-300 text-sm">
                      {formatRupiah(calculation.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* III. RENCANA TERMIN PEMBAYARAN */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs print-break-inside-avoid">
              <h4 className="font-bold text-slate-900 mb-2">III. Rencana Tahapan Pembayaran (Termin Kerja)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">Termin 1 (Uang Muka 30%)</div>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.30)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Saat MoU ditandatangani & mobilisasi material awal</div>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">Termin 2 (Progress 30%)</div>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.30)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Struktur pondasi, sloof, tiang kolom & dinding bata selesai</div>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">Termin 3 (Progress 35%)</div>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.35)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Rangka atap genteng, plesteran, acian & plafon selesai</div>
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold">Termin 4 (Pelunasan 5%)</div>
                  <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.05)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Serah terima kunci rumah & masa retensi pemeliharaan 30 hari</div>
                </div>
              </div>
            </div>

            {/* IV. KETENTUAN MATERIAL & TANGGUNG JAWAB */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs print-break-inside-avoid">
              <h4 className="font-bold text-slate-900 mb-1.5">IV. Ketentuan Ruang Lingkup & Tanggung Jawab</h4>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {isLaborOnly ? (
                  <span>
                    <strong>Perjanjian Borongan Upah Tenaga Saja:</strong> Penawaran ini hanya mencakup jasa pelaksanaan tenaga kerja konstruksi lengkap (mandor, kepala tukang, tukang batu/besi/kayu/cat/listrik, dan kenek). Seluruh pengadaan bahan material bangunan (semen 50kg, pasir pasang/cor, batu split, bata, besi beton, atap baja ringan, plafon, keramik, cat) disediakan sepenuhnya oleh <strong>Pihak Pemilik Rumah</strong> di lokasi pekerjaan tepat waktu.
                  </span>
                ) : (
                  <span>
                    <strong>Perjanjian Borongan Tenaga + Material (All-In):</strong> Penawaran ini mencakup pengadaan seluruh bahan material bangunan berkualitas SNI dan jasa tenaga kerja konstruksi lengkap sesuai spesifikasi BoQ. Pihak Pemborong bertanggung jawab atas mutu material dan hasil pelaksanaan fisik bangunan.
                  </span>
                )}
              </p>
            </div>

            {/* V. TANDA TANGAN DUAL SIGNATURE */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-center print-break-inside-avoid">
              <div>
                <div className="text-slate-500 mb-1">Diajukan Oleh:</div>
                <div className="font-bold text-slate-900">Kontraktor / Pemborong Pelaksana</div>
                <div className="h-20 flex items-end justify-center">
                  <div className="w-48 border-b border-slate-400"></div>
                </div>
                <div className="text-slate-600 mt-1">( .................................................... )</div>
              </div>

              <div>
                <div className="text-slate-500 mb-1">Disetujui Oleh:</div>
                <div className="font-bold text-slate-900">Pemilik Rumah / Pemberi Tugas</div>
                <div className="h-20 flex items-end justify-center">
                  <div className="w-48 border-b border-slate-400"></div>
                </div>
                <div className="text-slate-600 mt-1">
                  ( {project.clientName || '....................................................'} )
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: VERSI INTERNAL PEMBORONG (CONTRACTOR HPP & LOGISTICS) */}
        {/* ========================================================================= */}
        {reportMode === 'internal' && (
          <div className="space-y-6">
            {/* FINANCIAL DASHBOARD PEMBORONG */}
            <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Analisa Finansial Pemborong & Target Keuntungan
                  </span>
                </div>
                <span className="text-[11px] bg-red-800 text-white px-2 py-0.5 rounded font-mono font-bold">
                  INTERNAL USE ONLY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Nilai Kontrak Penawaran:</div>
                  <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                    {formatRupiah(calculation.grandTotal)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Tarif {formatRupiah(calculation.costPerM2)}/m²
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Modal Riil Lapangan (HPP):</div>
                  <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                    {formatRupiah(calculation.baseCost)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Bahan: {formatRupiah(calculation.totalMaterialCost)} · Upah: {formatRupiah(calculation.totalLaborCost)}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Estimasi Laba Bersih ({calculation.profitMarginPercent}%):</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    +{formatRupiah(calculation.profitAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-500 mt-0.5">
                    Keuntungan Pemborong
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">Dana Cadangan Tak Terduga ({calculation.contingencyPercent}%):</div>
                  <div className="text-base font-bold text-yellow-400 font-mono mt-0.5">
                    +{formatRupiah(calculation.contingencyAmount)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Buffer resiko & fluktuasi
                  </div>
                </div>
              </div>
            </div>

            {/* I. RINCIAN MODAL HPP PER 5 DIVISI PEKERJAAN */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>I. Rincian Modal Pokok Lapangan (HPP Bahan vs Upah)</span>
                <span className="text-[10px] font-normal text-slate-500">Standar SNI Lapangan</span>
              </h4>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-10 text-center">No</th>
                    <th className="py-2 px-2.5">Divisi Pekerjaan</th>
                    <th className="py-2 px-2.5 text-right w-32">Modal Bahan (Rp)</th>
                    <th className="py-2 px-2.5 text-right w-32">Modal Upah (Rp)</th>
                    <th className="py-2 px-2.5 text-right w-36">Total HPP Modal (Rp)</th>
                    <th className="py-2 px-2.5 text-right w-36">Nilai Penawaran (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {divisions.map((div, idx) => {
                    const roman = ['I', 'II', 'III', 'IV', 'V'][idx] || `${idx + 1}`;
                    return (
                      <tr key={div.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 text-center font-mono font-medium">{roman}</td>
                        <td className="py-2 px-2.5 font-semibold text-slate-900">
                          {div.title}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-700">
                          {formatRupiah(div.totalMaterialCost)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-slate-700">
                          {formatRupiah(div.totalLaborCost)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-rose-700">
                          {formatRupiah(div.totalHPP)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatRupiah(div.clientTotalCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-50">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-2.5 text-right text-slate-700">
                      TOTAL BIAYA HPP LAPANGAN:
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-800">
                      {formatRupiah(calculation.totalMaterialCost)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-800">
                      {formatRupiah(calculation.totalLaborCost)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-rose-800 text-sm">
                      {formatRupiah(calculation.baseCost)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-amber-900 text-sm">
                      {formatRupiah(calculation.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* II. DAFTAR BELANJA KEBUTUHAN MATERIAL LAPANGAN (MATERIAL TAKEOFF) */}
            <div className="print-break-inside-avoid">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>II. Daftar Kebutuhan Belanja Material Lapangan (Material Takeoff)</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Acuan Order Toko Bangunan & Supplier
                </span>
              </h4>
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-10 text-center">No</th>
                    <th className="py-2 px-2.5">Nama Material & Spesifikasi</th>
                    <th className="py-2 px-2.5 text-center w-24">Kategori</th>
                    <th className="py-2 px-2.5 text-right w-24">Volume Kebutuhan</th>
                    <th className="py-2 px-2.5 text-center w-20">Satuan</th>
                    <th className="py-2 px-2.5 text-right w-28">Harga Satuan (Rp)</th>
                    <th className="py-2 px-2.5 text-right w-32">Total Anggaran (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m, idx) => (
                    <tr key={m.materialId} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 text-center font-mono text-[11px] text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2.5">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        {m.notes && <div className="text-[10px] text-slate-500">{m.notes}</div>}
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {m.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono tabular-nums font-bold text-amber-900">
                        {formatNumber(m.quantity)}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-medium text-slate-700">
                        {m.unit}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(m.unitPrice)}
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatRupiah(m.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 font-bold bg-slate-100 text-slate-900">
                  <tr>
                    <td colSpan={6} className="py-2 px-2.5 text-right text-xs">
                      TOTAL ANGGARAN BELANJA MATERIAL LAPANGAN:
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono text-amber-900 text-sm">
                      {formatRupiah(calculation.totalMaterialCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* III. ALOKASI UPAH TUKANG & CASH FLOW BELANJA PER TERMIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-break-inside-avoid">
              {/* Alokasi Upah Borongan */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Alokasi Upah Borongan Tenaga Kerja per Divisi</span>
                </h4>
                <div className="space-y-1.5 pt-1">
                  {divisions.map((div, idx) => (
                    <div key={div.id} className="flex justify-between items-center py-1 border-b border-slate-200/60 text-slate-700">
                      <span>{idx + 1}. {div.title}</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(div.totalLaborCost)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold text-slate-900 border-t border-slate-300">
                    <span>Total Upah Tukang:</span>
                    <span className="font-mono text-emerald-800">{formatRupiah(calculation.totalLaborCost)}</span>
                  </div>
                </div>
              </div>

              {/* Rencana Cash Flow Belanja Lapangan */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jadwal Belanja & Alokasi Cash Flow Termin</span>
                </h4>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Termin 1 (Masuk: {formatRupiah(calculation.grandTotal * 0.3)})</span>
                      <span className="text-rose-700">Budget: ~{formatRupiah(calculation.baseCost * 0.28)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Belanja bowplank, pasir urug, semen 50kg & batu kali pondasi, besi tapak/sloof.
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Termin 2 (Masuk: {formatRupiah(calculation.grandTotal * 0.3)})</span>
                      <span className="text-rose-700">Budget: ~{formatRupiah(calculation.baseCost * 0.32)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Pengecoran kolom/balok/dak lantai 2, bata ringan hebel/merah & upah pasang dinding.
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Termin 3 (Masuk: {formatRupiah(calculation.grandTotal * 0.35)})</span>
                      <span className="text-rose-700">Budget: ~{formatRupiah(calculation.baseCost * 0.35)}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Baja ringan C75, genteng, semen acian 50kg, plafon gypsum/PVC, keramik & cat tembok.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TANDA TANGAN TIM KONTRAKTOR */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-xs text-center print-break-inside-avoid">
              <div>
                <div className="text-slate-500 mb-1">Dihitung Oleh:</div>
                <div className="font-bold text-slate-900">Estimator / QS</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="w-36 border-b border-slate-400"></div>
                </div>
                <div className="text-slate-600 mt-1">( ........................................ )</div>
              </div>

              <div>
                <div className="text-slate-500 mb-1">Pengawasan Lapangan:</div>
                <div className="font-bold text-slate-900">Site Manager / Mandor</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="w-36 border-b border-slate-400"></div>
                </div>
                <div className="text-slate-600 mt-1">( ........................................ )</div>
              </div>

              <div>
                <div className="text-slate-500 mb-1">Disetujui Oleh:</div>
                <div className="font-bold text-slate-900">Pimpinan Pemborong</div>
                <div className="h-16 flex items-end justify-center">
                  <div className="w-36 border-b border-slate-400"></div>
                </div>
                <div className="text-slate-600 mt-1">( ........................................ )</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
