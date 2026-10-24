import React, { useState, useMemo } from 'react';
import { SavedProject, ScopeMode, PackageComparisonItem } from '../types/rab';
import { calculatePackageComparison, formatRupiah, formatNumber } from '../utils/calculator';
import { 
  CheckCircle2, 
  Layers, 
  Hammer, 
  Package, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  X, 
  Info,
  Building2,
  DollarSign,
  PackageCheck
} from 'lucide-react';

interface PackageComparisonProps {
  project: SavedProject;
  onSelectScopeMode: (mode: ScopeMode) => void;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({
  project,
  onSelectScopeMode,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'upah_saja' | 'all_in'>('all');
  const [viewStyle, setViewStyle] = useState<'cards' | 'table'>('cards');

  const packages = useMemo(() => {
    return calculatePackageComparison(project);
  }, [project]);

  const filteredPackages = useMemo(() => {
    if (filterType === 'all') return packages;
    return packages.filter(p => p.type === filterType);
  }, [packages, filterType]);

  const totalArea = project.groundFloorArea + (project.floors === 2 ? project.secondFloorArea : 0);

  // Group packages for the card view
  const groupedCards = useMemo(() => {
    const groups: Record<string, { groupTitle: string; items: PackageComparisonItem[] }> = {
      ngaci_tanpa_plafon: {
        groupTitle: '1. Paket Sampai Ngaci TANPA Plafon',
        items: [],
      },
      ngaci_dengan_plafon: {
        groupTitle: '2. Paket Sampai Ngaci ADA Plafon',
        items: [],
      },
      finish_keramik_cat: {
        groupTitle: '3. Paket Sampai Finish Keramik & Cat',
        items: [],
      },
      buka_kunci: {
        groupTitle: '4. Paket Buka Kunci (Siap Huni Lengkap)',
        items: [],
      },
    };

    filteredPackages.forEach(pkg => {
      if (groups[pkg.groupKey]) {
        groups[pkg.groupKey].items.push(pkg);
      }
    });

    return Object.values(groups).filter(g => g.items.length > 0);
  }, [filteredPackages]);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-2xl p-6 sm:p-7 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fitur Perbandingan Hitungan Borongan Terpisah</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Perbandingan Hitungan Borongan Upah Saja vs All-In (+ Material)
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Kalkulator otomatis membedakan secara terpisah biaya <span className="text-amber-300 font-semibold">Upah Tenaga Saja</span> (material disiapkan oleh pemilik) dan <span className="text-emerald-300 font-semibold">Tenaga + Material</span> untuk paket <strong>s/d Ngaci tanpa plafon</strong>, <strong>s/d Ngaci ada plafon</strong>, <strong>s/d Finish keramik & cat</strong>, hingga <strong>Buka kunci siap huni</strong>.
          </p>

          <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Bangunan: <strong>{project.floors} Lantai ({totalArea} m²)</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Tinggi Dinding: <strong>{project.wallHeight} m</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <PackageCheck className="w-4 h-4 text-amber-400" />
              <span>Standar Semen: <strong>{project.cementBagWeight || 50} kg/sak</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & VIEW SWITCHER CONTROLS */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter tipe borongan */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Filter Tipe:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Paket ({packages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('upah_saja')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1 ${
                filterType === 'upah_saja'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>Upah Tenaga Saja</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all_in')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1 ${
                filterType === 'all_in'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Tenaga + Material</span>
            </button>
          </div>
        </div>

        {/* View style toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setViewStyle('cards')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewStyle === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu Berdampingan
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('table')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                viewStyle === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabel Matriks Lengkap
            </button>
          </div>
        </div>
      </div>

      {/* VIEW STYLE 1: CARDS BY GROUP */}
      {viewStyle === 'cards' && (
        <div className="space-y-8">
          {groupedCards.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    {groupIdx + 1}
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">
                    {group.groupTitle}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Perbandingan Berdampingan (Upah Saja vs All-In)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((pkg) => {
                  const isActive = project.scopeMode === pkg.id;
                  const isUpahSaja = pkg.type === 'upah_saja';

                  return (
                    <div
                      key={pkg.id}
                      className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                        isActive
                          ? 'border-amber-600 bg-amber-50/20 shadow-md ring-2 ring-amber-500/50'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {/* CARD TOP */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 ${
                                isUpahSaja
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {isUpahSaja ? <Hammer className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                              <span>{pkg.typeBadge}</span>
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {pkg.title}
                            </h3>
                          </div>

                          {isActive && (
                            <span className="shrink-0 inline-flex items-center gap-1 bg-amber-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                              <Check className="w-3.5 h-3.5" />
                              <span>Sedang Dipilih</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                          {pkg.description}
                        </p>

                        {/* PRICE BOX */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-4">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                              Total Estimasi RAB:
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Luas {totalArea} m²
                            </span>
                          </div>
                          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
                            {formatRupiah(pkg.grandTotal)}
                          </div>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mt-2 pt-2 border-t border-slate-200/60">
                            <span>Tarif per m²:</span>
                            <span className="text-amber-800 font-mono">{formatRupiah(pkg.costPerM2)} / m²</span>
                          </div>
                        </div>

                        {/* BREAKDOWN METRICS */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                          <div className="bg-slate-100/70 p-2.5 rounded-lg border border-slate-200/60">
                            <span className="text-[10px] text-slate-500 block">Biaya Upah Tenaga:</span>
                            <span className="font-bold text-slate-800 font-mono tabular-nums">
                              {formatRupiah(pkg.totalLaborCost)}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-lg border ${
                            isUpahSaja 
                              ? 'bg-blue-50/50 border-blue-100 text-blue-900' 
                              : 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                          }`}>
                            <span className="text-[10px] text-slate-500 block">Biaya Material:</span>
                            <span className="font-bold font-mono tabular-nums">
                              {isUpahSaja ? 'Rp 0 (Pemilik)' : formatRupiah(pkg.totalMaterialCost)}
                            </span>
                          </div>
                        </div>

                        {/* INCLUDED SCOPES */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Pekerjaan yang Termasuk:
                          </div>
                          <ul className="space-y-1">
                            {pkg.includedScopesList.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>

                          {pkg.excludedScopesList.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                Belum Termasuk:
                              </div>
                              <ul className="space-y-0.5">
                                {pkg.excludedScopesList.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                    <X className="w-3 h-3 text-rose-400 shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CARD BOTTOM ACTION */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => onSelectScopeMode(pkg.id)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            isActive
                              ? 'bg-amber-600 text-white shadow-xs cursor-default'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>Paket Ini Sedang Digunakan di RAB</span>
                            </>
                          ) : (
                            <>
                              <span>Gunakan Hitungan Paket Ini</span>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW STYLE 2: FULL MATRIX TABLE */}
      {viewStyle === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Matriks Perbandingan Lengkap Seluruh Paket ({packages.length} Paket)
            </h3>
            <span className="text-[11px] text-slate-500">
              Disinkronkan dengan Luas {totalArea} m² & Semen {project.cementBagWeight || 50}kg
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Nama Paket Borongan</th>
                  <th className="py-3 px-3 text-center">Tipe</th>
                  <th className="py-3 px-3 text-right">Biaya Upah</th>
                  <th className="py-3 px-3 text-right">Biaya Material</th>
                  <th className="py-3 px-3 text-right">Total RAB</th>
                  <th className="py-3 px-3 text-right">Tarif / m²</th>
                  <th className="py-3 px-3 text-center">Plafon</th>
                  <th className="py-3 px-3 text-center">Keramik & Cat</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => {
                  const isActive = project.scopeMode === pkg.id;
                  const isUpahSaja = pkg.type === 'upah_saja';

                  return (
                    <tr
                      key={pkg.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isActive ? 'bg-amber-50/50 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pkg.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{pkg.description}</div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isUpahSaja
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isUpahSaja ? 'Upah Saja' : 'Tenaga + Mat'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {formatRupiah(pkg.totalLaborCost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                        {isUpahSaja ? (
                          <span className="text-slate-400 text-[11px] italic">Disediakan Pemilik</span>
                        ) : (
                          <span className="text-slate-700">{formatRupiah(pkg.totalMaterialCost)}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(pkg.grandTotal)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800 font-semibold whitespace-nowrap">
                        {formatRupiah(pkg.costPerM2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {pkg.includesPlafon ? (
                          <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-300 text-[11px]">
                            <X className="w-3 h-3" /> Tidak
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {pkg.includesKeramik && pkg.includesCat ? (
                          <span className="inline-flex items-center text-emerald-600 font-bold text-[11px]">
                            <Check className="w-3.5 h-3.5" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-slate-300 text-[11px]">
                            <X className="w-3 h-3" /> Tidak
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectScopeMode(pkg.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-amber-600 text-white cursor-default'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isActive ? 'Aktif' : 'Pilih'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INFORMASI PANDUAN TEKNIS BORONGAN */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 text-xs text-blue-900 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
          <Info className="w-4 h-4 text-blue-700" />
          <span>Pedoman Praktis Menentukan Paket Borongan Rumah</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
          <div>
            <h4 className="font-bold text-blue-950 mb-1">1. Kapan Memilih "Upah Tenaga Saja"?</h4>
            <p className="text-blue-800/90 text-[11px]">
              Cocok jika pemilik rumah ingin menghemat anggaran, memiliki relasi supplier toko bangunan dengan diskon khusus, atau ingin memilih langsung kualitas merek semen 50kg, keramik, dan cat tanpa markup biaya material dari kontraktor.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-blue-950 mb-1">2. Kapan Memilih "Tenaga + Material (All-In)"?</h4>
            <p className="text-blue-800/90 text-[11px]">
              Cocok bagi pemilik yang tidak memiliki waktu untuk bolak-balik berbelanja semen, pasir, dan besi ke toko bangunan, serta menginginkan kepastian garansi hasil pekerjaan yang ditanggung sepenuhnya oleh pemborong.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
