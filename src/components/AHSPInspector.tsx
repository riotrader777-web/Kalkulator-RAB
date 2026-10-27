import React, { useState, useMemo } from 'react';
import { SavedProject, CalculationBreakdown, AHSPDivisionId, AHSPItemAnalysis } from '../types/rab';
import { formatNumber, formatRupiah, isLaborOnlyScope } from '../utils/calculator';
import { exportClientRABToExcel, exportInternalRABToExcel } from '../utils/excelExport';
import { 
  Calculator, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Printer, 
  Layers, 
  HardHat, 
  Package, 
  CheckCircle2, 
  Hammer, 
  Building2, 
  Info,
  SlidersHorizontal,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

interface AHSPInspectorProps {
  project: SavedProject;
  calculation: CalculationBreakdown;
  onNavigateToPrint?: () => void;
}

export const AHSPInspector: React.FC<AHSPInspectorProps> = ({
  project,
  calculation,
  onNavigateToPrint,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<AHSPDivisionId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showOnlyClientRates, setShowOnlyClientRates] = useState(false);

  const isLaborOnly = isLaborOnlyScope(project.scopeMode);
  const divisions = calculation.ahspDivisions || [];
  const allItems = calculation.ahspItems || [];

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    allItems.forEach(i => {
      next[i.id] = true;
    });
    setExpandedItems(next);
  };

  const collapseAll = () => {
    setExpandedItems({});
  };

  // Filter items
  const filteredDivisions = useMemo(() => {
    return divisions
      .filter(d => selectedDivision === 'all' || d.id === selectedDivision)
      .map(div => {
        const matchingItems = div.items.filter(item => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            item.codeSNI.toLowerCase().includes(q) ||
            item.coefficients.some(c => c.name.toLowerCase().includes(q))
          );
        });
        return {
          ...div,
          items: matchingItems,
        };
      })
      .filter(div => div.items.length > 0);
  }, [divisions, selectedDivision, searchQuery]);

  const totalFilteredHPP = useMemo(() => {
    return filteredDivisions.reduce((sum, d) => sum + d.totalHPP, 0);
  }, [filteredDivisions]);

  const totalFilteredClient = useMemo(() => {
    return filteredDivisions.reduce((sum, d) => sum + d.clientTotalCost, 0);
  }, [filteredDivisions]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-sm">
              <Calculator className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Analisa Harga Satuan Pekerjaan (AHSP Standard SNI)</span>
                <span className="text-[10px] bg-slate-900 text-amber-300 font-mono px-2 py-0.5 rounded font-semibold">
                  5 Divisi SNI
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perhitungan transparan koefisien bahan (semen 50kg, pasir, batu, besi) & upah tenaga (tukang, mandor) per satuan kerja.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportClientRABToExcel(project, calculation)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors shadow-2xs"
            title="Download file Excel format penawaran resmi untuk klien (tanpa modal HPP)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Klien</span>
          </button>

          <button
            type="button"
            onClick={() => exportInternalRABToExcel(project, calculation)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg transition-colors shadow-2xs"
            title="Download file Excel format internal pemborong (lengkap HPP, upah & belanja material)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Excel Internal Pemborong</span>
          </button>

          {onNavigateToPrint && (
            <button
              type="button"
              onClick={onNavigateToPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Laporan</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Divisions Filter Bar & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Division Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDivision('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedDivision === 'all'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Divisi ({allItems.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedDivision('persiapan_tanah')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedDivision === 'persiapan_tanah'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. Persiapan & Tanah
            </button>
            <button
              type="button"
              onClick={() => setSelectedDivision('struktur')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedDivision === 'struktur'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. Struktur & Tangga
            </button>
            <button
              type="button"
              onClick={() => setSelectedDivision('pasangan_finishing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedDivision === 'pasangan_finishing'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              3. Pasangan & Finishing
            </button>
            <button
              type="button"
              onClick={() => setSelectedDivision('atap_plafon')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedDivision === 'atap_plafon'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              4. Atap & Plafon
            </button>
            <button
              type="button"
              onClick={() => setSelectedDivision('me_elektrikal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedDivision === 'me_elektrikal'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              5. ME & Sanitasi
            </button>
          </div>

          {/* View Mode Toggle: Client View vs Internal HPP */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowOnlyClientRates(!showOnlyClientRates)}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showOnlyClientRates
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showOnlyClientRates ? 'Mode Penawaran Klien' : 'Mode Rincian Lengkap HPP'}</span>
            </button>
          </div>
        </div>

        {/* Search & Bulk Collapse */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari item pekerjaan (cth: sloof, semen, galian, hebel, cakar ayam, pipa)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 font-medium"
            >
              Buka Semua Koefisien
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded border border-slate-200 font-medium"
            >
              Tutup Semua Koefisien
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total HPP Lapangan
          </div>
          <div className="text-base font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {formatRupiah(totalFilteredHPP)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Modal Bahan + Upah Tukang
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Harga Penawaran Klien
          </div>
          <div className="text-base font-bold text-amber-700 mt-1 font-mono tabular-nums">
            {formatRupiah(totalFilteredClient)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Sudah dialokasikan margin {calculation.profitMarginPercent}%
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Standar Semen & Acian
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            Portland {project.cementBagWeight || 50}kg & Acian {project.acianBagWeight || 50}kg
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
            Sesuai Standar Sak 50 Kg
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Sistem Struktur & Plafon
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1">
            {calculation.foundationType.replace('_', ' ').toUpperCase()} · {calculation.ceilingType === 'pvc' ? 'Plafon PVC' : 'Gypsum 9mm'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Rumah {project.floors} Lantai ({calculation.totalBuildingArea} m²)
          </div>
        </div>
      </div>

      {/* Main AHSP Divisions & Items List */}
      <div className="space-y-6">
        {filteredDivisions.map((division) => (
          <div key={division.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Division Header */}
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[10px] text-amber-400 font-mono font-bold tracking-wider uppercase">
                  DIVISI {division.order} · STANDAR ANALISA SNI
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {division.title}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {division.subtitle}
                </p>
              </div>

              <div className="flex sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                <span className="text-[11px] text-slate-400">Total Nilai Penawaran:</span>
                <span className="text-sm font-bold text-amber-300 font-mono tabular-nums">
                  {formatRupiah(division.clientTotalCost)}
                </span>
                {!showOnlyClientRates && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    HPP Modal: {formatRupiah(division.totalHPP)}
                  </span>
                )}
              </div>
            </div>

            {/* Division Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Item Pekerjaan & Kode SNI</th>
                    <th className="py-2.5 px-3 text-right w-20">Volume</th>
                    <th className="py-2.5 px-3 text-center w-16">Satuan</th>
                    {!showOnlyClientRates && (
                      <>
                        <th className="py-2.5 px-3 text-right w-24">Bahan / Sat</th>
                        <th className="py-2.5 px-3 text-right w-24">Upah / Sat</th>
                        <th className="py-2.5 px-3 text-right w-28">HPP Satuan</th>
                        <th className="py-2.5 px-3 text-right w-28">Total HPP</th>
                      </>
                    )}
                    <th className="py-2.5 px-3 text-right w-28">Penawaran Satuan</th>
                    <th className="py-2.5 px-3 text-right w-32">Total Penawaran</th>
                    <th className="py-2.5 px-3 text-center w-12">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {division.items.map((item, idx) => {
                    const isExpanded = expandedItems[item.id];
                    return (
                      <React.Fragment key={item.id}>
                        {/* Main Item Row */}
                        <tr 
                          onClick={() => toggleExpand(item.id)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                {item.codeSNI}
                              </span>
                              <span>{item.coefficients.length} Komponen Biaya (Bahan & Upah)</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 tabular-nums">
                            {formatNumber(item.volume)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                            {item.unit}
                          </td>
                          {!showOnlyClientRates && (
                            <>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                                {formatRupiah(item.materialUnitCost)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600 tabular-nums">
                                {formatRupiah(item.laborUnitCost)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 tabular-nums">
                                {formatRupiah(item.unitPrice)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                                {formatRupiah(item.totalCost)}
                              </td>
                            </>
                          )}
                          <td className="py-2.5 px-3 text-right font-mono text-amber-900 font-semibold tabular-nums">
                            {formatRupiah(item.clientUnitPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-950 tabular-nums">
                            {formatRupiah(item.clientTotalCost)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                              title={isExpanded ? 'Tutup analisa koefisien' : 'Buka analisa koefisien SNI'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-amber-700" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible AHSP Coefficients Breakdown Row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={showOnlyClientRates ? 8 : 11} className="p-4 pl-12 border-b border-slate-200">
                              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Rincian Koefisien Analisa Satuan SNI ({item.codeSNI} per 1 {item.unit})</span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Total Kebutuhan Proyek: <span className="font-bold text-slate-800">{formatNumber(item.volume)} {item.unit}</span>
                                  </div>
                                </div>

                                <table className="w-full text-xs">
                                  <thead className="text-[11px] text-slate-500 bg-slate-50 border-b border-slate-200">
                                    <tr>
                                      <th className="py-1.5 px-2 text-center w-12">Kategori</th>
                                      <th className="py-1.5 px-2">Komponen Tenaga / Material</th>
                                      <th className="py-1.5 px-2 text-right w-20">Koefisien SNI</th>
                                      <th className="py-1.5 px-2 text-center w-16">Satuan</th>
                                      <th className="py-1.5 px-2 text-right w-28">Harga Acuan (Rp)</th>
                                      <th className="py-1.5 px-2 text-right w-28">Subtotal Satuan</th>
                                      <th className="py-1.5 px-2 text-right w-32">Kebutuhan Proyek</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {item.coefficients.map((coef, cIdx) => {
                                      const projectTotalQty = coef.coefficient * item.volume;
                                      return (
                                        <tr key={cIdx} className="hover:bg-slate-50/60">
                                          <td className="py-1.5 px-2 text-center">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                              coef.category === 'bahan' 
                                                ? 'bg-amber-100 text-amber-800' 
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {coef.category === 'bahan' ? 'Bahan' : 'Upah'}
                                            </span>
                                          </td>
                                          <td className="py-1.5 px-2 font-medium">
                                            {coef.name}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-800 tabular-nums">
                                            {coef.coefficient.toFixed(3)}
                                          </td>
                                          <td className="py-1.5 px-2 text-center text-slate-500">
                                            {coef.unit}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-mono text-slate-500 tabular-nums">
                                            {formatRupiah(coef.unitPrice)}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-mono font-semibold text-slate-900 tabular-nums">
                                            {formatRupiah(coef.totalCost)}
                                          </td>
                                          <td className="py-1.5 px-2 text-right font-mono font-bold text-emerald-800 tabular-nums">
                                            {projectTotalQty < 1 && projectTotalQty > 0 
                                              ? projectTotalQty.toFixed(2) 
                                              : Math.round(projectTotalQty).toLocaleString('id-ID')} {coef.unit}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot className="border-t border-slate-200 bg-slate-50/60 font-semibold">
                                    <tr>
                                      <td colSpan={5} className="py-1.5 px-2 text-right text-slate-600">
                                        Total Biaya Bahan Satuan:
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-slate-800">
                                        {formatRupiah(item.materialUnitCost)}
                                      </td>
                                      <td></td>
                                    </tr>
                                    <tr>
                                      <td colSpan={5} className="py-1.5 px-2 text-right text-slate-600">
                                        Total Biaya Upah Satuan:
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-slate-800">
                                        {formatRupiah(item.laborUnitCost)}
                                      </td>
                                      <td></td>
                                    </tr>
                                    <tr className="border-t border-slate-300 font-bold bg-slate-100">
                                      <td colSpan={5} className="py-1.5 px-2 text-right text-slate-900">
                                        HPP Dasar per 1 {item.unit}:
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-slate-900">
                                        {formatRupiah(item.unitPrice)}
                                      </td>
                                      <td className="py-1.5 px-2 text-right font-mono text-amber-900">
                                        Total HPP: {formatRupiah(item.totalCost)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
