import React, { useMemo } from 'react';
import { SavedProject, ScopeMode, WallMaterialType, CementBagWeight, CeilingMaterialType, AcianBagWeight, FoundationType } from '../types/rab';
import { formatRupiah, calculatePackageComparison } from '../utils/calculator';
import { 
  Building2, 
  Home, 
  Layers, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  LayoutTemplate, 
  PackageCheck, 
  Hammer, 
  Package, 
  Table2, 
  Sparkles,
  ArrowRight,
  Anchor,
  Boxes
} from 'lucide-react';

interface HouseConfiguratorProps {
  project: SavedProject;
  onChange: (updated: SavedProject) => void;
  calculatedHPP: number;
  calculatedProfit: number;
  calculatedGrandTotal: number;
  onNavigateToFloorPlan?: () => void;
  onNavigateToComparison?: () => void;
}

export const HouseConfigurator: React.FC<HouseConfiguratorProps> = ({
  project,
  onChange,
  calculatedHPP,
  calculatedProfit,
  calculatedGrandTotal,
  onNavigateToFloorPlan,
  onNavigateToComparison,
}) => {
  const updateProject = (patch: Partial<SavedProject>) => {
    onChange({
      ...project,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFloorsChange = (floors: 1 | 2) => {
    let secondFloorArea = project.secondFloorArea;
    if (floors === 2 && (!secondFloorArea || secondFloorArea === 0)) {
      secondFloorArea = project.groundFloorArea > 0 ? project.groundFloorArea : project.houseLength * project.houseWidth;
    }
    updateProject({
      floors,
      secondFloorArea: floors === 2 ? secondFloorArea : 0,
    });
  };

  const handleLengthWidthChange = (length: number, width: number) => {
    const groundFloorArea = Number((length * width).toFixed(1));
    const secondFloorArea = project.floors === 2 ? groundFloorArea : 0;
    updateProject({
      houseLength: length,
      houseWidth: width,
      groundFloorArea,
      secondFloorArea: project.floors === 2 ? secondFloorArea : project.secondFloorArea,
      useFloorPlanSync: false, // manual dimension changes overrides auto-sync unless synced from floor plan
    });
  };

  const handleScopeModeChange = (mode: ScopeMode) => {
    updateProject({ scopeMode: mode });
  };

  const totalArea = project.groundFloorArea + (project.floors === 2 ? project.secondFloorArea : 0);

  return (
    <div className="space-y-6">
      {/* REAL-TIME DYNAMIC AUTO-CALCULATION BANNER */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </span>
          <div>
            <span className="font-bold block text-sm text-slate-900">
              Kalkulasi Kebutuhan Material Berjalan Otomatis (Real-Time)
            </span>
            <span className="text-slate-600">
              Setiap perubahan ukuran panjang/lebar, lantai, tinggi dinding, atau denah langsung menghitung ulang volume sak semen 50kg, split, pasir, hebel/bata, besi, dan total RAB secara instan.
            </span>
          </div>
        </div>
        {project.useFloorPlanSync && (
          <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tersinkron dengan Denah Ruangan
          </span>
        )}
      </div>

      {/* 1. SELEKTOR MODEL LANTAI & DIMENSI */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dimensi & Parameter Struktur Rumah</h2>
              <p className="text-xs text-slate-500">Pilih jumlah lantai, masukkan ukuran denah, dan atur ketinggian dinding rumah.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* PILIHAN 1 LANTAI vs 2 LANTAI */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Pilihan Jumlah Lantai
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFloorsChange(1)}
                className={`flex flex-col items-center justify-center py-3 px-3 rounded-lg border text-center transition-all ${
                  project.floors === 1
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Home className={`w-5 h-5 mb-1 ${project.floors === 1 ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs">Rumah 1 Lantai</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Pondasi Standar</span>
              </button>

              <button
                type="button"
                onClick={() => handleFloorsChange(2)}
                className={`flex flex-col items-center justify-center py-3 px-3 rounded-lg border text-center transition-all ${
                  project.floors === 2
                    ? 'border-amber-600 bg-amber-50/60 text-amber-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <Building2 className={`w-5 h-5 mb-1 ${project.floors === 2 ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs">Rumah 2 Lantai</span>
                <span className="text-[10px] text-slate-500 mt-0.5">+ Cakar Ayam & Dak</span>
              </button>
            </div>
          </div>

          {/* MASUKAN KETINGGIAN RUMAH */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span>Ketinggian Rumah / Dinding</span>
              </label>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm tabular-nums">
                {project.wallHeight} Meter
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Tinggi dinding berpengaruh langsung pada volume hebel/bata, plesteran, acian, dan kolom tiang.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2.8"
                max="5.0"
                step="0.1"
                value={project.wallHeight ?? 3.5}
                onChange={(e) => updateProject({ wallHeight: parseFloat(e.target.value) || 3.5 })}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <input
                type="number"
                min="2.5"
                max="6.0"
                step="0.1"
                value={project.wallHeight ?? 3.5}
                onChange={(e) => updateProject({ wallHeight: parseFloat(e.target.value) || 3.5 })}
                className="w-20 px-2.5 py-1.5 text-xs text-center border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none tabular-nums font-semibold"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Standar (3.0m)</span>
              <span>Sedang (3.5m)</span>
              <span>Tinggi Plafon (4.2m+)</span>
            </div>
          </div>

          {/* PILIHAN BOBOT SAK SEMEN (PORTLAND & ACIAN 50KG) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Semen Portland (Cor & Pasang)</span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {project.cementBagWeight || 50} Kg / Sak
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateProject({ cementBagWeight: 50 as CementBagWeight })}
                  className={`py-1.5 px-2.5 text-xs rounded-lg border text-left transition-all ${
                    (project.cementBagWeight || 50) === 50
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Semen 50 Kg</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Standar sak besar</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateProject({ cementBagWeight: 40 as CementBagWeight })}
                  className={`py-1.5 px-2.5 text-xs rounded-lg border text-left transition-all ${
                    project.cementBagWeight === 40
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold">Semen 40 Kg</div>
                  <div className="text-[10px] text-slate-500">Sak 40 Kg opsional</div>
                </button>
              </div>
            </div>

            {/* PILIHAN BOBOT SAK SEMEN ACIAN (50KG vs 40KG) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span>Semen Acian Dinding</span>
                  <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 py-0.2 rounded">Tersedia 50kg</span>
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {project.acianBagWeight || 50} Kg / Sak
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateProject({ acianBagWeight: 50 as AcianBagWeight })}
                  className={`py-1.5 px-2.5 text-xs rounded-lg border text-left transition-all ${
                    (project.acianBagWeight || 50) === 50
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-2xs ring-1 ring-amber-500/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Acian 50 Kg</span>
                    </span>
                    {(project.acianBagWeight || 50) === 50 && <CheckCircle2 className="w-3 h-3 text-amber-600" />}
                  </div>
                  <div className="text-[10px] text-slate-500">Daya sebar ±21 m²/sak</div>
                </button>

                <button
                  type="button"
                  onClick={() => updateProject({ acianBagWeight: 40 as AcianBagWeight })}
                  className={`py-1.5 px-2.5 text-xs rounded-lg border text-left transition-all ${
                    project.acianBagWeight === 40
                      ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold">Acian 40 Kg</div>
                  <div className="text-[10px] text-slate-500">Daya sebar ±17 m²/sak</div>
                </button>
              </div>
            </div>

            {/* Material Dinding & Plafon */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Jenis Dinding:</span>
                <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => updateProject({ wallType: 'hebel' as WallMaterialType })}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      project.wallType === 'hebel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hebel
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProject({ wallType: 'bata_merah' as WallMaterialType })}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      project.wallType === 'bata_merah' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bata Merah
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Pilihan Plafon:</span>
                <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => updateProject({ ceilingType: 'gypsum' as CeilingMaterialType })}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      (project.ceilingType || 'gypsum') === 'gypsum' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gypsum
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProject({ ceilingType: 'pvc' as CeilingMaterialType })}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      project.ceilingType === 'pvc' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Plafon PVC
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HIGHLIGHT DETAIL PILIHAN PLAFON (GYPSUM vs PVC) */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-lg border bg-slate-50/80 border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <span className={`p-1.5 rounded-lg shrink-0 ${
                project.ceilingType === 'pvc' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Spesifikasi Plafon: {project.ceilingType === 'pvc' ? 'Plafon PVC Tahan Air & Anti-Rayap' : 'Plafon Gypsum 9mm + Dempul Jointing'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    project.ceilingType === 'pvc' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {project.ceilingType === 'pvc' ? 'Bebas Biaya Cat Plafon' : 'Perlu Pengecatan Plafon'}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                  {project.ceilingType === 'pvc'
                    ? 'Panel plafon PVC tebal 8mm (lebar 20cm x panjang 4m) motif rapi, anti air & jamur, dilengkapi rangka hollow galvanis + list profil keliling dinding. Tidak memerlukan dempul kompon maupun cat plafon.'
                    : 'Papan gypsum tebal 9mm rata halus untuk ruangan interior, dipasang pada rangka hollow galvanis 2x4 & 4x4 dengan dempul jointing compound dan finishing cat plafon putih.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={() => updateProject({ ceilingType: 'gypsum' as CeilingMaterialType })}
                className={`px-2.5 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  (project.ceilingType || 'gypsum') === 'gypsum'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pilih Gypsum
              </button>
              <button
                type="button"
                onClick={() => updateProject({ ceilingType: 'pvc' as CeilingMaterialType })}
                className={`px-2.5 py-1.5 rounded-md font-semibold text-xs transition-all ${
                  project.ceilingType === 'pvc'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pilih Plafon PVC
              </button>
            </div>
          </div>
        </div>

        {/* DIMENSI DENAH (PANJANG x LEBAR & LUAS) */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Panjang Bangunan (m)
            </label>
            <input
              type="number"
              min="3"
              max="100"
              step="0.5"
              value={project.houseLength ?? 10}
              onChange={(e) => handleLengthWidthChange(parseFloat(e.target.value) || 1, project.houseWidth ?? 6)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none tabular-nums"
              placeholder="e.g. 10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lebar Bangunan (m)
            </label>
            <input
              type="number"
              min="3"
              max="100"
              step="0.5"
              value={project.houseWidth ?? 6}
              onChange={(e) => handleLengthWidthChange(project.houseLength ?? 10, parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none tabular-nums"
              placeholder="e.g. 6"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Luas Lantai 1 (m²)
              </label>
              {project.useFloorPlanSync && (
                <span className="text-[10px] text-emerald-700 font-medium">Dari Denah</span>
              )}
            </div>
            <input
              type="number"
              min="10"
              step="1"
              value={project.groundFloorArea ?? 60}
              onChange={(e) => updateProject({ groundFloorArea: parseFloat(e.target.value) || 0, useFloorPlanSync: false })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none tabular-nums font-semibold"
            />
          </div>

          {project.floors === 2 ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Luas Lantai 2 (m²)
                </label>
                {project.useFloorPlanSync && (
                  <span className="text-[10px] text-emerald-700 font-medium">Dari Denah</span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={project.secondFloorArea ?? 0}
                onChange={(e) => updateProject({ secondFloorArea: parseFloat(e.target.value) || 0, useFloorPlanSync: false })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none tabular-nums font-semibold"
              />
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Luas Bangunan</span>
                <span className="text-sm font-bold text-slate-900 tabular-nums">{totalArea} m²</span>
              </div>
              {onNavigateToFloorPlan && (
                <button
                  type="button"
                  onClick={onNavigateToFloorPlan}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Atur Denah</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. PILIHAN JENIS PONDASI RUMAH (FOOTPLAT vs CAKAR AYAM vs BATU KALI vs STRAUSS PILE) */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center">
                <Anchor className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Pilihan Jenis Pondasi Rumah</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Otomatis Menyesuaikan Besi & Cor
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pilih sistem pondasi yang digunakan. Volume besi beton, semen cor, pasir beton, dan batu split akan otomatis terhitung ulang.
                </p>
              </div>
            </div>

            {/* Quick Live Stats Badge */}
            <div className="flex items-center gap-2 shrink-0 text-[11px]">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium flex items-center gap-1">
                <span className="text-slate-400">Titik:</span>
                <strong className="text-slate-900 font-bold tabular-nums">
                  {(project.foundationType || (project.floors === 2 ? 'cakar_ayam' : 'footplat')) === 'batu_kali'
                    ? '0 Titik (Menerus)' 
                    : `${Math.max(6, Math.round((project.groundFloorArea || 60) / 5.5))} Titik`}
                </strong>
              </span>
              <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200 font-medium flex items-center gap-1">
                <span className="text-amber-600">Cor:</span>
                <strong className="text-amber-950 font-bold tabular-nums">
                  {(() => {
                    const fType = project.foundationType || (project.floors === 2 ? 'cakar_ayam' : 'footplat');
                    const pts = fType === 'batu_kali' ? 0 : Math.max(6, Math.round((project.groundFloorArea || 60) / 5.5));
                    const perPt = fType === 'cakar_ayam' ? (project.floors === 2 ? 0.25 : 0.16) : fType === 'footplat' ? (project.floors === 2 ? 0.16 : 0.095) : fType === 'strauss_pile' ? 0.304 : 0;
                    return (pts * perPt).toFixed(1);
                  })()} m³
                </strong>
              </span>
            </div>
          </div>

          {/* Foundation Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Footplat */}
            {(() => {
              const activeF = project.foundationType || (project.floors === 2 ? 'cakar_ayam' : 'footplat');
              const isSelected = activeF === 'footplat';
              return (
                <button
                  type="button"
                  onClick={() => updateProject({ foundationType: 'footplat' as FoundationType })}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">Footplat (Telapak Plat)</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-800 mb-1">
                      {project.floors === 2 ? 'Ukuran 80×80 cm (Besi D12)' : 'Ukuran 60×60 cm (Besi D10/12)'}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Plat telapak beton bertulang tapak tunggal di bawah setiap kolom struktur + pasangan batu kali keliling.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Hemat & Efisien</span>
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      {project.floors === 1 ? 'Sangat Populer' : 'Standard 2 Lt'}
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* 2. Cakar Ayam */}
            {(() => {
              const activeF = project.foundationType || (project.floors === 2 ? 'cakar_ayam' : 'footplat');
              const isSelected = activeF === 'cakar_ayam';
              return (
                <button
                  type="button"
                  onClick={() => updateProject({ foundationType: 'cakar_ayam' as FoundationType })}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">Cakar Ayam (Tulangan Dobel)</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-800 mb-1">
                      {project.floors === 2 ? 'Ukuran 100×100 cm (Dobel Grid D12)' : 'Ukuran 80×80 cm (Dobel Grid D12)'}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Tulangan rangkap 2 lapis (dobel mesh) dengan cakar/angkur pengaku. Kekakuan tinggi untuk 2 lantai & tanah lunak.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">+45% Pembesian</span>
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      {project.floors === 2 ? 'Rekomendasi 2 Lt' : 'Ekstra Kokoh'}
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* 3. Batu Kali Menerus */}
            {(() => {
              const activeF = project.foundationType || (project.floors === 2 ? 'cakar_ayam' : 'footplat');
              const isSelected = activeF === 'batu_kali';
              return (
                <button
                  type="button"
                  onClick={() => updateProject({ foundationType: 'batu_kali' as FoundationType })}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">Batu Kali Menerus Saja</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-800 mb-1">
                      Profil Menerus Penahan Penuh
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Hanya lajur batu belah menerus tanpa titik tapak beton cor. Volume batu belah lebih tebal, tanpa besi tapak.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Tanpa Cor Tapak</span>
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      Khusus 1 Lantai
                    </span>
                  </div>
                </button>
              );
            })()}

            {/* 4. Strauss Pile */}
            {(() => {
              const activeF = project.foundationType || (project.floors === 2 ? 'cakar_ayam' : 'footplat');
              const isSelected = activeF === 'strauss_pile';
              return (
                <button
                  type="button"
                  onClick={() => updateProject({ foundationType: 'strauss_pile' as FoundationType })}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 text-slate-900 shadow-sm ring-1 ring-amber-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-900">Strauss Pile (Tiang Bor)</span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-800 mb-1">
                      Ø25 cm Dalam 4m + Pile Cap
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Pondasi dalam tiang bor tanah manual sampai tanah keras + pile cap beton bertulang penyambung kolom & sloof.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Beban Tertinggi</span>
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>
                      Tanah Lunak/Labil
                    </span>
                  </div>
                </button>
              );
            })()}
          </div>

          {/* Explanation Info Box */}
          <div className="mt-3 p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 flex items-start gap-2.5 text-xs">
            <span className="text-amber-700 mt-0.5">
              <Boxes className="w-4 h-4" />
            </span>
            <div className="text-slate-700 text-[11px] leading-relaxed">
              <strong className="text-slate-900 font-semibold">Dampak Penyesuaian Otomatis: </strong>
              Memilih antara <strong className="text-amber-900">Footplat</strong> dan <strong className="text-amber-900">Cakar Ayam</strong> langsung memperbarui kebutuhan <strong className="text-slate-900">Besi Beton D12</strong> (panjang tulangan & begel), <strong className="text-slate-900">Batu Split</strong>, <strong className="text-slate-900">Pasir Beton</strong>, serta jumlah <strong className="text-slate-900">Semen 50kg</strong> pada Bill of Quantities (BoQ) dan Daftar Material Takeoff.
            </div>
          </div>
        </div>
      </div>

      {/* 2. PILIHAN SCOPE BORONGAN & FINISHING TERPISAH */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pilihan Hitungan Borongan (Terpisah Upah Saja vs All-In)</h2>
              <p className="text-xs text-slate-500">
                Pilih batasan borongan: s/d Ngaci tanpa plafon, s/d Ngaci ada plafon, s/d Finish keramik & cat, atau Buka kunci.
              </p>
            </div>
          </div>

          {onNavigateToComparison && (
            <button
              type="button"
              onClick={onNavigateToComparison}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
            >
              <Table2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Bandingkan Semua Paket</span>
              <ArrowRight className="w-3 h-3 text-amber-600" />
            </button>
          )}
        </div>

        {/* 4 KELOMPOK PILIHAN BORONGAN TERPISAH */}
        <div className="space-y-4">
          {/* GRUP 1: SAMPAI NGACI TANPA PLAFON */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                <span className="text-xs font-bold text-slate-900">Paket Sampai Ngaci TANPA Plafon</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Pondasi + Struktur + Dinding diplester/diaci + Atap</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opsi 1A: Upah Tenaga Saja Tanpa Plafon */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('upah_ngaci_tanpa_plafon')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'upah_ngaci_tanpa_plafon'
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upah Tenaga Saja (Tanpa Plafon)</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Upah Saja</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tukang s/d dinding diaci mulus. Tanpa plafon. Material dibeli pemilik.
                </p>
              </button>

              {/* Opsi 1B: Tenaga + Material Tanpa Plafon */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('allin_ngaci_tanpa_plafon')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'allin_ngaci_tanpa_plafon' || project.scopeMode === 'ngaci_tanpa_plafon'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tenaga + Material (Tanpa Plafon)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">All-In Mat</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Lengkap bahan material + tukang s/d dinding diaci & atap. Belum ada plafon.
                </p>
              </button>
            </div>
          </div>

          {/* GRUP 2: SAMPAI NGACI ADA PLAFON */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <span className="text-xs font-bold text-slate-900">Paket Sampai Ngaci ADA Plafon</span>
              </div>
              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                {project.ceilingType === 'pvc' ? '+ Pasang Rangka Hollow & Plafon PVC Tahan Air' : '+ Pasang Rangka Hollow & Plafon Gypsum'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opsi 2A: Upah Tenaga Saja Ada Plafon */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('upah_ngaci_dengan_plafon')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'upah_ngaci_dengan_plafon'
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upah Tenaga Saja (Ada Plafon)</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Upah Saja</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tukang s/d dinding diaci + pasang rangka plafon gypsum. Material disiapkan pemilik.
                </p>
              </button>

              {/* Opsi 2B: Tenaga + Material Ada Plafon */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('allin_ngaci_dengan_plafon')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'allin_ngaci_dengan_plafon' || project.scopeMode === 'ngaci_dengan_plafon'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tenaga + Material (Ada Plafon)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">All-In Mat</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Lengkap material + tukang s/d acian + plafon gypsum interior rapi terpasang.
                </p>
              </button>
            </div>
          </div>

          {/* GRUP 3: SAMPAI FINISH KERAMIK & CAT */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                <span className="text-xs font-bold text-slate-900">Paket Sampai Finish Keramik & Cat</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                + Pasang Keramik/Granit Lantai & Cat Dinding/Plafon
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opsi 3A: Upah Tenaga Saja Finish Keramik & Cat */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('upah_finish_keramik_cat')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'upah_finish_keramik_cat'
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upah Saja s/d Finish Keramik & Cat</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Upah Saja</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Upah tukang s/d selesai pasang keramik dan cat interior/eksterior. Material disiapkan pemilik.
                </p>
              </button>

              {/* Opsi 3B: Tenaga + Material Finish Keramik & Cat */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('allin_finish_keramik_cat')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'allin_finish_keramik_cat'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tenaga + Material (Keramik & Cat)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">All-In Mat</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Material keramik granit + cat tembok interior & eksterior beserta jasa tukang lengkap.
                </p>
              </button>
            </div>
          </div>

          {/* GRUP 4: BUKA KUNCI SIAP HUNI LENGKAP */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">4</span>
                <span className="text-xs font-bold text-slate-900">Paket Buka Kunci (Siap Huni Lengkap 10 Bidang)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Termasuk Sanitair, Pintu/Kusen & Instalasi Listrik</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Opsi 4A: Upah Tenaga Saja Buka Kunci */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('upah_buka_kunci')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'upah_buka_kunci' || project.scopeMode === 'labor_only'
                    ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Hammer className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upah Tenaga Saja (Buka Kunci)</span>
                  </span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Upah Saja</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Upah tukang untuk semua 10 pekerjaan sampai rumah siap huni. Material disediakan pemilik.
                </p>
              </button>

              {/* Opsi 4B: All-In Buka Kunci Siap Huni */}
              <button
                type="button"
                onClick={() => handleScopeModeChange('allin_buka_kunci')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  project.scopeMode === 'allin_buka_kunci' || project.scopeMode === 'turnkey'
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-600 text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Borongan Buka Kunci (All-In Siap Huni)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">All-In Siap Huni</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Material + upah lengkap serah terima kunci. Pemilik terima beres siap ditempati.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* CUSTOM CHECKLIST SCOPE */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Rincian Bidang Pekerjaan yang Sedang Aktif:</span>
            <button
              type="button"
              onClick={() => handleScopeModeChange('custom')}
              className={`text-xs font-medium px-2 py-0.5 rounded transition-colors ${
                project.scopeMode === 'custom'
                  ? 'bg-amber-100 text-amber-900 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {project.scopeMode === 'custom' ? 'Mode Checklist Kustom Aktif' : 'Atur Manual (Mode Kustom)'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {[
              { id: 'pondasi', label: 'Pondasi & Galian' },
              { id: 'struktur', label: 'Struktur Beton' },
              { id: 'dinding_aci', label: 'Dinding & Acian' },
              { id: 'atap', label: 'Atap Baja Ringan' },
              { id: 'plafon', label: project.ceilingType === 'pvc' ? 'Plafon PVC (Anti Air)' : 'Plafon Gypsum' },
              { id: 'lantai_keramik', label: 'Lantai Keramik' },
              { id: 'pintu_jendela', label: 'Pintu & Kusen' },
              { id: 'sanitair', label: 'Sanitasi & Pipa' },
              { id: 'cat_finishing', label: 'Pengecatan' },
              { id: 'listrik', label: 'Instalasi Listrik' },
            ].map(item => {
              const key = item.id as keyof typeof project.customScopes;
              let isChecked = false;

              if (project.scopeMode === 'custom') {
                isChecked = Boolean(project.customScopes[key]);
              } else if (
                project.scopeMode === 'turnkey' ||
                project.scopeMode === 'allin_buka_kunci' ||
                project.scopeMode === 'labor_only' ||
                project.scopeMode === 'upah_buka_kunci'
              ) {
                isChecked = true;
              } else if (
                project.scopeMode === 'ngaci_tanpa_plafon' ||
                project.scopeMode === 'allin_ngaci_tanpa_plafon' ||
                project.scopeMode === 'upah_ngaci_tanpa_plafon'
              ) {
                isChecked = ['pondasi', 'struktur', 'dinding_aci', 'atap'].includes(key);
              } else if (
                project.scopeMode === 'ngaci_dengan_plafon' ||
                project.scopeMode === 'allin_ngaci_dengan_plafon' ||
                project.scopeMode === 'upah_ngaci_dengan_plafon'
              ) {
                isChecked = ['pondasi', 'struktur', 'dinding_aci', 'atap', 'plafon'].includes(key);
              } else if (
                project.scopeMode === 'upah_finish_keramik_cat' ||
                project.scopeMode === 'allin_finish_keramik_cat'
              ) {
                isChecked = ['pondasi', 'struktur', 'dinding_aci', 'atap', 'plafon', 'lantai_keramik', 'cat_finishing'].includes(key);
              }

              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-2 p-2 rounded-md border text-slate-800 transition-colors ${
                    isChecked ? 'bg-slate-50 border-slate-300 font-medium' : 'bg-white border-slate-200 opacity-50'
                  } ${project.scopeMode === 'custom' ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'}`}
                >
                  <input
                    type="checkbox"
                    disabled={project.scopeMode !== 'custom'}
                    checked={isChecked}
                    onChange={(e) => {
                      if (project.scopeMode === 'custom') {
                        updateProject({
                          customScopes: {
                            ...project.customScopes,
                            [key]: e.target.checked,
                          },
                        });
                      }
                    }}
                    className="accent-amber-600 rounded"
                  />
                  <span className="text-xs truncate">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. EDIT NOMINAL PER METER PERSEGI & AMBIL UNTUNG (PROFIT MARGIN %) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Edit Nominal Per Meter Persegi & Ambil Untung (%)</h2>
              <p className="text-xs text-slate-500">
                Atur tarif benchmark per m² dan persentase keuntungan pemborong/kontraktor.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EDIT NOMINAL PER M2 */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Nominal Tarif Per Meter Persegi (m²)
                </label>
                <span className="text-xs font-bold text-indigo-700 tabular-nums">
                  {formatRupiah(project.ratePerM2)} / m²
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Bisa Anda sesuaikan manual sebagai patokan harga borongan per meter di wilayah Anda.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Rp</span>
                <input
                  type="number"
                  step="50000"
                  value={project.ratePerM2 ?? 3650000}
                  onChange={(e) => updateProject({ ratePerM2: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-md focus:border-indigo-500 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            {/* PRESET TARIF PER M2 */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 self-center mr-1">Preset:</span>
              <button
                type="button"
                onClick={() => updateProject({ ratePerM2: 2900000 })}
                className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Sederhana (2.9 jt)
              </button>
              <button
                type="button"
                onClick={() => updateProject({ ratePerM2: 3650000 })}
                className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Standar (3.65 jt)
              </button>
              <button
                type="button"
                onClick={() => updateProject({ ratePerM2: 4500000 })}
                className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Menengah Plus (4.5 jt)
              </button>
              <button
                type="button"
                onClick={() => updateProject({ ratePerM2: 5800000 })}
                className="text-[11px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Mewah (5.8 jt)
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Estimasi via Tarif m²:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(totalArea * (project.ratePerM2 ?? 3650000))}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  id="chkManualBenchmark"
                  checked={project.useManualBenchmark ?? false}
                  onChange={(e) => updateProject({ useManualBenchmark: e.target.checked })}
                  className="accent-indigo-600 rounded cursor-pointer"
                />
                <label htmlFor="chkManualBenchmark" className="text-slate-700 cursor-pointer select-none">
                  Kunci total RAB menggunakan tarif nominal per m² ini
                </label>
              </div>
            </div>
          </div>

          {/* FITUR AMBIL UNTUNG (PROFIT MARGIN %) */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ambil Untung Pemborong / Fee Kontraktor (%)</span>
                </label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded tabular-nums">
                  {project.profitMarginPercent ?? 12}% Margin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                Persentase keuntungan bersih pemborong yang ditambahkan di atas modal riil / HPP material & tenaga.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={project.profitMarginPercent ?? 12}
                  onChange={(e) => updateProject({ profitMarginPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={project.profitMarginPercent ?? 12}
                    onChange={(e) => updateProject({ profitMarginPercent: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1.5 text-xs text-center border border-slate-300 rounded-md focus:border-emerald-500 focus:outline-none tabular-nums font-bold"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* CADANGAN BIAYA TAK TERDUGA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Cadangan Biaya Tak Terduga (Contingency)
                </label>
                <span className="text-xs font-semibold text-slate-700 tabular-nums">
                  {project.contingencyPercent ?? 3}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={project.contingencyPercent ?? 3}
                  onChange={(e) => updateProject({ contingencyPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full accent-slate-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <span className="text-xs tabular-nums w-12 text-right">{project.contingencyPercent ?? 3}%</span>
              </div>
            </div>

            {/* LIVE PROFIT & TOTAL PREVIEW */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Modal Riil / HPP Konstruksi:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupiah(calculatedHPP)}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-medium">
                <span>Nilai Keuntungan Anda ({project.profitMarginPercent}%):</span>
                <span className="font-bold tabular-nums">+{formatRupiah(calculatedProfit)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-emerald-200 text-sm">
                <span>Estimasi Total Penawaran:</span>
                <span className="text-emerald-700 tabular-nums">{formatRupiah(calculatedGrandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
