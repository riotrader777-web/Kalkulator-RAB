import React from 'react';
import { SavedProject, CalculationBreakdown } from '../types/rab';
import { formatNumber, formatRupiah, isLaborOnlyScope, getScopeModeMetadata } from '../utils/calculator';
import { Printer, Download } from 'lucide-react';

interface PrintableRABReportProps {
  project: SavedProject;
  calculation: CalculationBreakdown;
}

export const PrintableRABReport: React.FC<PrintableRABReportProps> = ({
  project,
  calculation,
}) => {
  const isLaborOnly = isLaborOnlyScope(project.scopeMode);
  const totalArea = calculation.totalBuildingArea;
  const metadata = getScopeModeMetadata(project.scopeMode);
  const scopeTitle = metadata.title;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Controls for printing */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Format Resmi Surat Penawaran & Dokumen RAB</h3>
          <p className="text-xs text-slate-500">
            Tampilan rapi siap cetak atau simpan sebagai dokumen PDF untuk diserahkan ke klien/pemilik rumah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan ke PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 shadow-sm text-slate-900 font-sans print-shadow-none">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
              RAB PRO · KONTRAKTOR & ESTIMATOR BANGUNAN
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Spesialis Pembangunan Rumah Tinggal 1 & 2 Lantai · Ruko · Renovasi
            </div>
            <div className="text-xs text-slate-500">
              Telp / WhatsApp: 0812-XXXX-XXXX · Email: kontak@rabrumahpro.id
            </div>
          </div>
          <div className="text-left sm:text-right text-xs">
            <div className="font-bold text-slate-900 text-sm">SURAT PENAWARAN & RAB</div>
            <div className="text-slate-600 font-mono">No: RAB/{new Date().getFullYear()}/{project.id.slice(-6).toUpperCase()}</div>
            <div className="text-slate-500">Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Project Info Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6 text-xs">
          <div className="space-y-1">
            <div className="text-slate-500">Nama Proyek:</div>
            <div className="font-bold text-slate-900 text-sm">{project.name}</div>
            <div className="text-slate-500 pt-1">Pemilik / Klien:</div>
            <div className="font-semibold text-slate-800">{project.clientName || 'Bapak / Ibu Pemilik'}</div>
            {project.location && (
              <>
                <div className="text-slate-500 pt-1">Lokasi Proyek:</div>
                <div className="text-slate-800">{project.location}</div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-slate-500">Spesifikasi Bangunan:</div>
            <div className="font-semibold text-slate-900">
              Rumah {project.floors} Lantai (Dimensi {project.houseLength}m x {project.houseWidth}m)
            </div>
            <div className="text-slate-700">
              Total Luas: <span className="font-bold tabular-nums">{totalArea} m²</span> · Tinggi Dinding: <span className="font-bold tabular-nums">{project.wallHeight} Meter</span>
            </div>
            <div className="text-slate-700">
              Dinding: <span className="font-semibold">{project.wallType === 'hebel' ? 'Bata Ringan Hebel' : 'Bata Merah'}</span> · Plafon: <span className="font-semibold">{project.ceilingType === 'pvc' ? 'Plafon PVC Tahan Air' : 'Plafon Gypsum 9mm'}</span>
            </div>
            <div className="text-slate-700">
              Semen: <span className="font-semibold">Standar Sak 50 Kg ({calculation.totalCementBags} Sak)</span>
            </div>
            {project.useFloorPlanSync && (
              <div className="text-slate-700">
                Denah Ruangan: <span className="font-semibold">{calculation.roomCount} Ruangan ({calculation.bathroomCount} Kamar Mandi)</span>
              </div>
            )}
            <div className="text-slate-500 pt-1">Paket Borongan:</div>
            <div className="font-bold text-amber-900">{scopeTitle}</div>
          </div>
        </div>

        {/* REKAPITULASI BIAYA PER DIVISI */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
            I. Rekapitulasi Rencana Anggaran Biaya (RAB)
          </h4>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No</th>
                <th className="py-2.5 px-3">Divisi Pekerjaan</th>
                <th className="py-2.5 px-3 text-center w-28">Status</th>
                <th className="py-2.5 px-3 text-right w-40">Jumlah Biaya (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculation.categories.map((cat, idx) => {
                const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][idx] || `${idx + 1}`;
                return (
                  <tr key={cat.id} className={cat.included ? '' : 'text-slate-400 bg-slate-50/50'}>
                    <td className="py-2 px-3 text-center font-mono font-medium">{roman}</td>
                    <td className="py-2 px-3 font-medium">
                      {cat.title}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        cat.included ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {cat.included ? 'Termasuk' : 'Dikecualikan'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold">
                      {cat.included ? formatRupiah(cat.totalCost) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-300 divide-y divide-slate-200 font-semibold bg-slate-50">
              <tr>
                <td colSpan={3} className="py-2 px-3 text-right text-slate-700">
                  Subtotal Modal Pokok Konstruksi (HPP):
                </td>
                <td className="py-2 px-3 text-right font-mono text-slate-900 tabular-nums">
                  {formatRupiah(calculation.baseCost)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="py-2 px-3 text-right text-emerald-800">
                  Jasa Pemborong / Kontraktor ({calculation.profitMarginPercent}%):
                </td>
                <td className="py-2 px-3 text-right font-mono text-emerald-800 tabular-nums">
                  +{formatRupiah(calculation.profitAmount)}
                </td>
              </tr>
              {calculation.contingencyPercent > 0 && (
                <tr>
                  <td colSpan={3} className="py-2 px-3 text-right text-slate-600">
                    Dana Cadangan / Tak Terduga ({calculation.contingencyPercent}%):
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-800 tabular-nums">
                    +{formatRupiah(calculation.contingencyAmount)}
                  </td>
                </tr>
              )}
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
                  Biaya Per Meter Persegi (Luas Bangunan {totalArea} m²):
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-xs">
                  {formatRupiah(calculation.costPerM2)} / m²
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* PAYMENT TERMS / SKEMA TERMIN */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs print-break-inside-avoid">
          <h4 className="font-bold text-slate-900 mb-2">II. Rencana Tahapan Pembayaran (Termin Kerja)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-[11px] text-slate-500">Termin 1 (Uang Muka 30%)</div>
              <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.3)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Saat MoU ditandatangani & mobilisasi material awal</div>
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-[11px] text-slate-500">Termin 2 (Progress 30%)</div>
              <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.3)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Struktur pondasi, sloof, tiang kolom & dinding bata selesai</div>
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-[11px] text-slate-500">Termin 3 (Progress 35%)</div>
              <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.35)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Rangka atap genteng, plesteran, acian & plafon selesai</div>
            </div>
            <div className="p-2.5 bg-white rounded border border-slate-200">
              <div className="text-[11px] text-slate-500">Termin 4 (Pelunasan 5%)</div>
              <div className="font-bold text-slate-900 mt-0.5 font-mono">{formatRupiah(calculation.grandTotal * 0.05)}</div>
              <div className="text-[10px] text-slate-500 mt-1">Serah terima kunci rumah & masa retensi pemeliharaan 30 hari</div>
            </div>
          </div>
        </div>

        {/* SCOPE & MATERIAL RESPONSIBILITY TERMS */}
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs print-break-inside-avoid">
          <h4 className="font-bold text-slate-900 mb-1.5">III. Ketentuan Ruang Lingkup & Tanggung Jawab Material</h4>
          <p className="text-slate-700 leading-relaxed text-[11px]">
            {isLaborOnly ? (
              <span>
                <strong>Perjanjian Upah Tenaga Saja:</strong> Penawaran ini hanya mencakup jasa pelaksanaan tenaga kerja (mandor, kepala tukang, tukang batu/besi, dan kenek). Seluruh pengadaan bahan material bangunan (semen 50kg, pasir pasang/cor, batu split, hebel/bata merah, besi beton, bendrat, atap baja ringan, plafon, keramik, cat) disediakan sepenuhnya oleh <strong>Pihak Pertama (Pemilik Rumah)</strong> di lokasi pekerjaan.
              </span>
            ) : (
              <span>
                <strong>Perjanjian Tenaga + Material (All-In):</strong> Penawaran ini mencakup pengadaan seluruh bahan material dan jasa tenaga kerja konstruksi lengkap sesuai rincian BoQ di atas. Pihak Pemborong bertanggung jawab atas kualitas spesifikasi material dan mutu hasil pekerjaan.
              </span>
            )}
          </p>
        </div>

        {/* SIGNATURE BLOCK */}
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
    </div>
  );
};
