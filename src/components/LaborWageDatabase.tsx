import React, { useState } from 'react';
import { SavedProject, WorkerWageRates } from '../types/rab';
import { 
  REGIONAL_WAGE_BENCHMARKS, 
  WORKER_ROLE_METAS, 
  getEffectiveWorkerWages, 
  DEFAULT_OPERATIONAL_REGION_ID 
} from '../data/regionalWages';
import { formatRupiah } from '../utils/calculator';
import { 
  Users, 
  MapPin, 
  RotateCcw, 
  TrendingUp, 
  Briefcase, 
  ShieldCheck, 
  HelpCircle, 
  Check, 
  ArrowRight, 
  DollarSign,
  Clock,
  HardHat,
  Sparkles,
  Info
} from 'lucide-react';

interface LaborWageDatabaseProps {
  project: SavedProject;
  onProjectChange: (updated: SavedProject) => void;
  onNavigateToSchedule?: () => void;
  onNavigateToAHSP?: () => void;
}

export function LaborWageDatabase({
  project,
  onProjectChange,
  onNavigateToSchedule,
  onNavigateToAHSP,
}: LaborWageDatabaseProps) {
  const currentRegionId = project.operationalRegionId || DEFAULT_OPERATIONAL_REGION_ID;
  const currentRegion = REGIONAL_WAGE_BENCHMARKS.find(r => r.id === currentRegionId) || REGIONAL_WAGE_BENCHMARKS[0];
  
  const effectiveWages = getEffectiveWorkerWages(project);
  const customWages = project.customWorkerWages || {};

  const [notification, setNotification] = useState<string | null>(null);

  // Crew simulation composition
  const [crewMandor, setCrewMandor] = useState(1);
  const [crewKepala, setCrewKepala] = useState(1);
  const [crewTukang, setCrewTukang] = useState(4);
  const [crewKenek, setCrewKenek] = useState(4);

  const showTempNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Change operational region
  const handleSelectRegion = (regionId: string) => {
    const selected = REGIONAL_WAGE_BENCHMARKS.find(r => r.id === regionId);
    if (!selected) return;

    onProjectChange({
      ...project,
      operationalRegionId: regionId,
      updatedAt: new Date().toISOString(),
    });
    showTempNotification(`Wilayah operasional diubah ke: ${selected.name}`);
  };

  // Change individual role wage
  const handleWageChange = (roleKey: keyof WorkerWageRates, value: number) => {
    const validVal = isNaN(value) ? 0 : Math.max(0, value);
    const updatedCustom = {
      ...(project.customWorkerWages || {}),
      [roleKey]: validVal,
    };

    onProjectChange({
      ...project,
      customWorkerWages: updatedCustom,
      updatedAt: new Date().toISOString(),
    });
  };

  // Reset all custom wages to standard region benchmark
  const handleResetToRegionalStandard = () => {
    onProjectChange({
      ...project,
      customWorkerWages: {},
      updatedAt: new Date().toISOString(),
    });
    showTempNotification(`Upah telah dikembalikan ke standar ${currentRegion.name}`);
  };

  // Quick adjust percentage (+5% or +10%)
  const handleApplyMultiplier = (multiplier: number, label: string) => {
    const newCustom: Partial<WorkerWageRates> = {};
    (Object.keys(effectiveWages) as (keyof WorkerWageRates)[]).forEach(role => {
      const currentVal = effectiveWages[role] || 0;
      // Round to nearest 1.000
      newCustom[role] = Math.round((currentVal * (1 + multiplier)) / 1000) * 1000;
    });

    onProjectChange({
      ...project,
      customWorkerWages: newCustom,
      updatedAt: new Date().toISOString(),
    });
    showTempNotification(`Berhasil menerapkan penyesuaian upah ${label}`);
  };

  // Reset single role
  const handleResetSingleRole = (roleKey: keyof WorkerWageRates) => {
    if (!project.customWorkerWages) return;
    const nextCustom = { ...project.customWorkerWages };
    delete nextCustom[roleKey];

    onProjectChange({
      ...project,
      customWorkerWages: nextCustom,
      updatedAt: new Date().toISOString(),
    });
    showTempNotification(`Upah ${roleKey} dikembalikan ke standar wilayah.`);
  };

  // Calculate daily crew payroll
  const dailyCrewCost = 
    (crewMandor * effectiveWages.mandor) +
    (crewKepala * effectiveWages.kepalaTukang) +
    (crewTukang * effectiveWages.tukangBatu) +
    (crewKenek * effectiveWages.pekerja);

  const weeklyCrewCost = dailyCrewCost * 6; // 6 working days per week

  const hasAnyCustomWages = Object.keys(customWages).length > 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Database Upah Konstruksi & Tenaga Kerja</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tarif Upah Tukang & Kenek Berdasarkan Wilayah
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Pilih standar wilayah operasional proyek Anda di Indonesia atau masukkan upah harian kerja (Orang Hari - OH) secara manual. Perubahan upah akan langsung mengkalkulasi ulang biaya pada <strong>Analisa AHSP (SNI)</strong> dan <strong>RAB Total</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigateToAHSP && (
              <button
                type="button"
                onClick={onNavigateToAHSP}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>Cek AHSP Terkini</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onNavigateToSchedule && (
              <button
                type="button"
                onClick={onNavigateToSchedule}
                className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>Lihat Kurva S & Jadwal</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Standar Jam Kerja</p>
              <p className="text-slate-500 text-2xs">7 Jam Kerja Efektif / Hari (08.00 - 16.00 WIB)</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Wilayah Aktif: {currentRegion.name}</p>
              <p className="text-slate-500 text-2xs">{currentRegion.tier} • {currentRegion.province}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">Status Kustomisasi</p>
              <p className="text-slate-500 text-2xs">
                {hasAnyCustomWages 
                  ? `${Object.keys(customWages).length} peran upah diedit manual` 
                  : 'Mengikuti acuan standar wilayah murni'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: REGIONAL BENCHMARK SELECTOR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>1. Pilih Wilayah Operasional Proyek</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih basis wilayah untuk memuat estimasi pasar yang relevan
            </p>
          </div>

          {hasAnyCustomWages && (
            <button
              type="button"
              onClick={handleResetToRegionalStandard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua ke Standar Wilayah</span>
            </button>
          )}
        </div>

        {/* Region Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {REGIONAL_WAGE_BENCHMARKS.map(region => {
            const isSelected = region.id === currentRegionId;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => handleSelectRegion(region.id)}
                className={`text-left p-3.5 rounded-xl border transition-all relative ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {region.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0 mt-1"></span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {region.tier.split(' ')[0]}
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                  <span>Tukang Batu:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatRupiah(region.rates.tukangBatu)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-500 mt-0.5">
                  <span>Kenek/Laden:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatRupiah(region.rates.pekerja)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-2xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Catatan Wilayah: {currentRegion.notes}</span>
        </div>
      </div>

      {/* SECTION 2: MANUAL INPUT & WORKER RATES TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600" />
              <span>2. Rincian Upah Pekerja & Input Manual (Rp / OH)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ketik langsung nominal pada kolom upah harian untuk menyesuaikan dengan negosiasi mandor di lapangan
            </p>
          </div>

          {/* Quick adjust buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyMultiplier(0.05, '+5%')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
              title="Tambahkan 5% untuk antisipasi inflasi atau lembur ringan"
            >
              <TrendingUp className="w-3 h-3 text-amber-600" />
              <span>+5% Lembur</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyMultiplier(0.10, '+10%')}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
              title="Tambahkan 10% untuk proyek mendesak atau medan sulit"
            >
              <TrendingUp className="w-3 h-3 text-amber-600" />
              <span>+10% Remote</span>
            </button>
          </div>
        </div>

        {/* Roles Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <th className="py-3 px-3">Kode SNI</th>
                <th className="py-3 px-3">Peran Tenaga Kerja</th>
                <th className="py-3 px-3 hidden md:table-cell">Kualifikasi & Tanggung Jawab Lapangan</th>
                <th className="py-3 px-3 text-right">Standar Wilayah</th>
                <th className="py-3 px-3 text-right">Upah Diterapkan (Rp/OH)</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {WORKER_ROLE_METAS.map(meta => {
                const currentVal = effectiveWages[meta.key] || 0;
                const standardVal = currentRegion.rates[meta.key] || 0;
                const isCustom = customWages[meta.key] !== undefined && customWages[meta.key] !== standardVal;

                return (
                  <tr key={meta.key} className="hover:bg-slate-50/70 transition-colors">
                    {/* Kode SNI */}
                    <td className="py-3 px-3 font-mono text-slate-500 font-bold whitespace-nowrap">
                      {meta.sniCode || '-'}
                    </td>

                    {/* Peran */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{meta.title}</div>
                      <div className="text-2xs text-slate-400 md:hidden mt-0.5">
                        {meta.shortDesc}
                      </div>
                    </td>

                    {/* Deskripsi */}
                    <td className="py-3 px-3 hidden md:table-cell text-slate-500 max-w-xs">
                      {meta.shortDesc}
                    </td>

                    {/* Standar Wilayah */}
                    <td className="py-3 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {formatRupiah(standardVal)}
                    </td>

                    {/* Input Upah Aktif */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span className="text-2xs text-slate-400 font-mono">Rp</span>
                        <input
                          type="number"
                          step={5000}
                          value={currentVal || ''}
                          onChange={e => handleWageChange(meta.key, parseInt(e.target.value, 10))}
                          className={`w-28 sm:w-32 px-2.5 py-1.5 text-right font-mono text-xs font-bold rounded-lg border focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                            isCustom
                              ? 'bg-amber-50/70 border-amber-400 text-amber-950 font-black'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Status & Reset button */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isCustom ? (
                        <div className="inline-flex items-center gap-1">
                          <span className="inline-block px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-800">
                            Manual
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetSingleRole(meta.key)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Kembalikan ke standar wilayah"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-600">
                          Standar
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Upah Borongan m² Reference */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-600" />
              <span>Benchmark Upah Borongan Per Meter Persegi (m²) di {currentRegion.name}</span>
            </h4>
            <p className="text-2xs text-slate-500 mt-0.5">
              Diterapkan jika memilih model perhitungan borongan tenaga m²
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-2xs text-slate-500 block">Bangun Penuh (All-In):</span>
              <span className="font-bold text-slate-900">{formatRupiah(effectiveWages.boronganM2Full || 1150000)} / m²</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-2xs text-slate-500 block">s/d Ngaci (Tanpa Finishing):</span>
              <span className="font-bold text-slate-900">{formatRupiah(effectiveWages.boronganM2Ngaci || 650000)} / m²</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CREW PAYROLL SIMULATOR */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/15 text-white text-xs font-bold mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Simulasi Anggaran Tim Kerja Lapangan</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight">
              Kebutuhan Kas Upah Tukang & Kenek
            </h3>
            <p className="text-xs text-amber-100 mt-1 leading-relaxed">
              Atur jumlah personil pekerja yang akan bekerja harian untuk memperkirakan pengeluaran uang saku / gajian tukang setiap minggunya (Sabtuan/Opname).
            </p>

            {/* Crew stepper controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-black/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-2xs text-amber-100 block">Mandor</span>
                <div className="flex items-center justify-between mt-1">
                  <button 
                    type="button" 
                    onClick={() => setCrewMandor(Math.max(0, crewMandor - 1))}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm">{crewMandor} Org</span>
                  <button 
                    type="button" 
                    onClick={() => setCrewMandor(crewMandor + 1)}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-black/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-2xs text-amber-100 block">Kepala Tukang</span>
                <div className="flex items-center justify-between mt-1">
                  <button 
                    type="button" 
                    onClick={() => setCrewKepala(Math.max(0, crewKepala - 1))}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm">{crewKepala} Org</span>
                  <button 
                    type="button" 
                    onClick={() => setCrewKepala(crewKepala + 1)}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-black/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-2xs text-amber-100 block">Tukang Spesialis</span>
                <div className="flex items-center justify-between mt-1">
                  <button 
                    type="button" 
                    onClick={() => setCrewTukang(Math.max(1, crewTukang - 1))}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm">{crewTukang} Org</span>
                  <button 
                    type="button" 
                    onClick={() => setCrewTukang(crewTukang + 1)}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-black/15 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-2xs text-amber-100 block">Pekerja / Kenek</span>
                <div className="flex items-center justify-between mt-1">
                  <button 
                    type="button" 
                    onClick={() => setCrewKenek(Math.max(1, crewKenek - 1))}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-sm">{crewKenek} Org</span>
                  <button 
                    type="button" 
                    onClick={() => setCrewKenek(crewKenek + 1)}
                    className="w-6 h-6 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results card */}
          <div className="bg-amber-950/40 border border-white/15 rounded-2xl p-5 shrink-0 min-w-[260px] flex flex-col justify-between">
            <div>
              <span className="text-2xs uppercase tracking-wider text-amber-200 font-semibold block">
                Total Anggota Tim: {crewMandor + crewKepala + crewTukang + crewKenek} Orang
              </span>
              
              <div className="mt-3">
                <span className="text-2xs text-amber-200 block">Biaya Kas Harian (1 Hari):</span>
                <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                  {formatRupiah(dailyCrewCost)}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <span className="text-2xs text-amber-200 block">Estimasi Gajian Mingguan (6 Hari):</span>
                <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                  {formatRupiah(weeklyCrewCost)}
                </div>
              </div>
            </div>

            <p className="text-2xs text-amber-200/80 mt-4 leading-normal">
              * Perhitungan riil berdasarkan upah per OH aktif di tabel atas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
