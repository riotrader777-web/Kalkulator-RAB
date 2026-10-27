import React, { useState } from 'react';
import { CalculationBreakdown } from '../types/rab';
import { formatNumber, formatRupiah } from '../utils/calculator';
import { FileSpreadsheet, ChevronDown, ChevronRight, Calculator, Printer } from 'lucide-react';

interface BoQTableProps {
  calculation: CalculationBreakdown;
  isLaborOnly: boolean;
  onNavigateToAHSP?: () => void;
  onNavigateToPrint?: () => void;
}

export const BoQTable: React.FC<BoQTableProps> = ({
  calculation,
  isLaborOnly,
  onNavigateToAHSP,
  onNavigateToPrint,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    calculation.categories.forEach(c => {
      allCollapsed[c.id] = true;
    });
    setCollapsedCategories(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedCategories({});
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Rincian Rencana Anggaran Biaya (RAB / Bill of Quantities)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Format standar analisa biaya konstruksi per divisi pekerjaan, volume, dan akumulasi biaya.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToAHSP && (
            <button
              type="button"
              onClick={onNavigateToAHSP}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-semibold hover:bg-amber-100 flex items-center gap-1"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Analisa AHSP (SNI)</span>
            </button>
          )}
          {onNavigateToPrint && (
            <button
              type="button"
              onClick={onNavigateToPrint}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak / Export</span>
            </button>
          )}
          <button
            type="button"
            onClick={expandAll}
            className="text-xs px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Buka Semua
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="text-xs px-2.5 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {isLaborOnly && (
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] shrink-0">
              UPAH TENAGA SAJA
            </span>
            <span>
              Kolom biaya material bernilai Rp 0 karena seluruh material disediakan langsung oleh pemilik. Total RAB hanya mencakup upah tukang & mandor.
            </span>
          </div>
          <span className="text-[11px] text-blue-700 font-semibold whitespace-nowrap">
            Jasa Konstruksi
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Uraian Divisi & Item Pekerjaan</th>
              <th className="py-3 px-4 text-right w-24">Volume</th>
              <th className="py-3 px-4 text-center w-20">Satuan</th>
              <th className="py-3 px-4 text-right w-32">Harga Satuan</th>
              <th className="py-3 px-4 text-right w-36">Jumlah Harga (Rp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {calculation.categories.map((category, catIdx) => {
              const isCollapsed = collapsedCategories[category.id];
              const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][catIdx] || `${catIdx + 1}`;

              if (!category.included) {
                return (
                  <tr key={category.id} className="bg-slate-50/50 opacity-40">
                    <td className="py-2.5 px-4 text-center font-bold font-mono">{roman}</td>
                    <td colSpan={4} className="py-2.5 px-4 font-semibold text-slate-500 line-through">
                      {category.title} (Tidak Termasuk dalam Scope Pekerjaan)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">Rp 0</td>
                  </tr>
                );
              }

              return (
                <React.Fragment key={category.id}>
                  {/* Category Header Row */}
                  <tr
                    onClick={() => toggleCategory(category.id)}
                    className="bg-slate-100/70 hover:bg-slate-200/50 cursor-pointer font-bold select-none border-t border-slate-200"
                  >
                    <td className="py-2.5 px-4 text-center font-mono text-slate-900">{roman}</td>
                    <td colSpan={4} className="py-2.5 px-4 text-slate-900 flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                      <span>{category.title}</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({category.subItems.length} item)
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-900 tabular-nums">
                      {formatRupiah(category.totalCost)}
                    </td>
                  </tr>

                  {/* Sub-items */}
                  {!isCollapsed &&
                    category.subItems.map((item, itemIdx) => (
                      <tr key={itemIdx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {catIdx + 1}.{itemIdx + 1}
                        </td>
                        <td className="py-2 px-4 pl-8 text-slate-700">
                          {item.name}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-800 tabular-nums font-medium">
                          {formatNumber(item.volume)}
                        </td>
                        <td className="py-2 px-4 text-center font-medium text-slate-500">
                          {item.unit}
                        </td>
                        <td className="py-2 px-4 text-right font-mono text-slate-500 tabular-nums">
                          {item.unitPrice > 0 ? formatRupiah(item.unitPrice) : '-'}
                        </td>
                        <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {formatRupiah(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 divide-y divide-slate-200 text-xs">
            {/* HPP Subtotal */}
            <tr className="bg-slate-50">
              <td colSpan={5} className="py-3 px-4 text-right font-bold text-slate-700">
                Subtotal Modal Pokok Konstruksi (HPP / Biaya Riil Material & Upah):
              </td>
              <td className="py-3 px-4 text-right font-bold font-mono text-slate-900 tabular-nums text-sm">
                {formatRupiah(calculation.baseCost)}
              </td>
            </tr>

            {/* Profit Margin Markup */}
            <tr className="bg-emerald-50/50 text-emerald-950">
              <td colSpan={5} className="py-2.5 px-4 text-right font-semibold">
                Ambil Untung Pemborong / Margin Laba Kontraktor ({calculation.profitMarginPercent}%):
              </td>
              <td className="py-2.5 px-4 text-right font-bold font-mono text-emerald-700 tabular-nums">
                +{formatRupiah(calculation.profitAmount)}
              </td>
            </tr>

            {/* Contingency */}
            {calculation.contingencyPercent > 0 && (
              <tr className="bg-slate-50/70 text-slate-700">
                <td colSpan={5} className="py-2.5 px-4 text-right font-medium">
                  Cadangan Biaya Tak Terduga ({calculation.contingencyPercent}%):
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                  +{formatRupiah(calculation.contingencyAmount)}
                </td>
              </tr>
            )}

            {/* Grand Total */}
            <tr className="bg-slate-900 text-white font-bold text-sm">
              <td colSpan={5} className="py-4 px-4 text-right">
                TOTAL PENAWARAN HARGA PROYEK (GRAND TOTAL RAB):
              </td>
              <td className="py-4 px-4 text-right font-mono tabular-nums text-amber-400 text-base">
                {formatRupiah(calculation.grandTotal)}
              </td>
            </tr>

            {/* Effective Rate per m2 */}
            <tr className="bg-slate-100 text-slate-700 font-semibold">
              <td colSpan={5} className="py-2.5 px-4 text-right">
                Biaya Efektif Per Meter Persegi (Luas {calculation.totalBuildingArea} m²):
              </td>
              <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                {formatRupiah(calculation.costPerM2)} / m²
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
