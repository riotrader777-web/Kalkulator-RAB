import React, { useState, useEffect, useMemo } from 'react';
import { SavedProject } from './types/rab';
import { DEFAULT_PROJECT } from './data/defaultCatalog';
import { calculateRAB, formatRupiah, isLaborOnlyScope, getScopeModeMetadata } from './utils/calculator';
import { getSavedProjects, saveProject, getActiveProjectId, setActiveProjectId, normalizeProject } from './utils/storage';
import { HouseElevationDiagram } from './components/HouseElevationDiagram';
import { HouseConfigurator } from './components/HouseConfigurator';
import { FloorPlanDesigner } from './components/FloorPlanDesigner';
import { PackageComparison } from './components/PackageComparison';
import { MaterialCatalogEditor } from './components/MaterialCatalogEditor';
import { MaterialTakeoffList } from './components/MaterialTakeoffList';
import { BoQTable } from './components/BoQTable';
import { ProjectManager } from './components/ProjectManager';
import { PrintableRABReport } from './components/PrintableRABReport';
import { ShareAndAndroidModal } from './components/ShareAndAndroidModal';
import { 
  Building2, 
  Layers, 
  Calculator, 
  Package, 
  FileSpreadsheet, 
  FolderGit2, 
  Printer, 
  Sliders, 
  Check, 
  ArrowRight,
  LayoutTemplate,
  PackageCheck,
  Table2,
  Hammer,
  Smartphone,
  Share2
} from 'lucide-react';

export default function App() {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject>(() => normalizeProject(DEFAULT_PROJECT));
  const [activeTab, setActiveTab] = useState<'kalkulator' | 'paket' | 'denah' | 'material' | 'takeoff' | 'boq' | 'proyek' | 'cetak'>('kalkulator');
  const [quickSaveNotice, setQuickSaveNotice] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Initialize projects from localStorage on mount
  useEffect(() => {
    const list = getSavedProjects();
    setSavedProjects(list);
    const activeId = getActiveProjectId();
    const found = list.find(p => p.id === activeId);
    if (found) {
      setCurrentProject(found);
    } else if (list.length > 0) {
      setCurrentProject(list[0]);
    }
  }, []);

  // Compute live calculation breakdown whenever currentProject changes
  const calculation = useMemo(() => {
    return calculateRAB(currentProject);
  }, [currentProject]);

  // Handle project updates
  const handleProjectChange = (updated: SavedProject) => {
    setCurrentProject(updated);
    // Auto-save to localStorage
    const newList = saveProject(updated);
    setSavedProjects(newList);
    setActiveProjectId(updated.id);
  };

  const handleSelectProject = (project: SavedProject) => {
    setCurrentProject(project);
    setActiveProjectId(project.id);
  };

  const handleProjectsListUpdated = (list: SavedProject[]) => {
    setSavedProjects(list);
  };

  const totalArea = currentProject.groundFloorArea + (currentProject.floors === 2 ? currentProject.secondFloorArea : 0);
  const isLaborOnly = isLaborOnlyScope(currentProject.scopeMode);
  const scopeMeta = getScopeModeMetadata(currentProject.scopeMode);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* TOP BAR CONTRACT: Brand Wordmark — 4-5 Navigation Links — 1 Primary Action */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark (Single Text Element) */}
          <div className="flex items-center gap-2.5">
            <a href="/" className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                RAB
              </span>
              <span>RAB Rumah Pro</span>
            </a>
            <span className="hidden xl:inline text-xs text-slate-400 font-mono">
              / Semen 50kg & Denah
            </span>
          </div>

          {/* Zone 2: Navigation Links (Single-Line, 5 Concise Labels) */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-5 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('kalkulator')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'kalkulator' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              Kalkulator Utama
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paket')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activeTab === 'paket' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Bandingkan Paket</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('denah')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                activeTab === 'denah' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              <span>Denah Rumah</span>
              {currentProject.useFloorPlanSync && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('material')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'material' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              Harga Material
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('takeoff')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'takeoff' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              Kebutuhan Fisik
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('boq')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'boq' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              Rincian BoQ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('proyek')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'proyek' ? 'text-amber-700 font-bold border-b-2 border-amber-600 py-4 -mb-4' : ''
              }`}
            >
              Proyek Tersimpan
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {quickSaveNotice && (
              <span className="text-xs text-emerald-700 hidden sm:flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> Tersimpan
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Akses HP & APK</span>
              <span className="sm:hidden">APK</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cetak')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Penawaran</span>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV BAR */}
      <div className="md:hidden no-print bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="px-2.5 py-1.5 rounded-md whitespace-nowrap font-bold text-amber-950 bg-amber-100 border border-amber-300 flex items-center gap-1 shrink-0"
        >
          <Smartphone className="w-3 h-3 text-amber-700" />
          <span>Akses HP & APK</span>
        </button>
        {[
          { id: 'kalkulator', label: 'Kalkulator' },
          { id: 'paket', label: 'Bandingkan Paket' },
          { id: 'denah', label: 'Denah Rumah' },
          { id: 'material', label: 'Harga Material' },
          { id: 'takeoff', label: 'Kebutuhan Fisik' },
          { id: 'boq', label: 'BoQ' },
          { id: 'proyek', label: 'Proyek' },
          { id: 'cetak', label: 'Cetak' },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap font-medium transition-colors ${
              activeTab === t.id
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI METRIC STRIP (Full-Width Top Summary) */}
        <section className="no-print mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Grand Total */}
            <div className="pt-2 md:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total RAB
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isLaborOnly ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {scopeMeta.badge}
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
                {formatRupiah(calculation.grandTotal)}
              </div>
              <span className="text-[10px] text-slate-500 block truncate" title={scopeMeta.title}>
                {scopeMeta.title}
              </span>
            </div>

            {/* Modal Riil (HPP) */}
            <div className="pt-2 md:pt-0 md:pl-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Modal Pokok (HPP)
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-700 font-mono tabular-nums mt-0.5">
                {formatRupiah(calculation.baseCost)}
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                {isLaborOnly ? 'Upah tenaga saja (Mat: Rp 0 Pemilik)' : 'Material + Upah kerja lengkap'}
              </span>
            </div>

            {/* Keperluan Semen 50kg */}
            <div className="pt-2 md:pt-0 md:pl-4">
              <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Kebutuhan Semen 50kg</span>
              </span>
              <div className="text-base sm:text-lg font-bold text-amber-900 font-mono tabular-nums mt-0.5">
                {calculation.totalCementBags} Sak
              </div>
              <span className="text-[10px] text-amber-700 font-medium">
                Sak 50 Kg (Cor, Spesi & Plester)
              </span>
            </div>

            {/* Biaya per m2 */}
            <div className="pt-2 md:pt-0 md:pl-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Tarif Efektif / m²
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                {formatRupiah(calculation.costPerM2)}
              </div>
              <span className="text-[10px] text-slate-500">
                Luas {totalArea} m² (Tinggi {currentProject.wallHeight}m)
              </span>
            </div>

            {/* Status Denah & Proyek */}
            <div className="col-span-2 md:col-span-1 pt-2 md:pt-0 md:pl-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Status Model Bangunan
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1 flex-wrap">
                <span>{currentProject.floors} Lantai</span>
                <span className="text-xs text-slate-500">
                  ({currentProject.wallType === 'hebel' ? 'Hebel' : 'Bata'} · {currentProject.ceilingType === 'pvc' ? 'Plafon PVC' : 'Gypsum'})
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block truncate">
                {currentProject.useFloorPlanSync ? '✓ Denah Terintegrasi' : 'Dimensi Manual'}
              </span>
            </div>
          </div>
        </section>

        {/* WORKSPACE CONTENT TABS */}
        {activeTab === 'kalkulator' && (
          <div className="space-y-6">
            {/* Quick Hero Banner with Architectural Inspiration */}
            <div className="no-print relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-white p-6 shadow-sm">
              <img
                src="/src/assets/images/hero_house_construction_1791976433150.jpg"
                alt="Modern Tropical Architectural House"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-25"
              />
              <div className="relative z-10 max-w-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/20 border border-amber-400/30 px-2.5 py-1 rounded">
                  Proyek: {currentProject.name} · Standar Semen 50 Kg
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-2 tracking-tight">
                  Kalkulator Estimasi Biaya & Kebutuhan Bangun Rumah
                </h1>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Hitung otomatis biaya bangun rumah 1 & 2 lantai, sak semen 50kg, batu split, bata hebel/merah, pasir, besi beton, bendrat, atap baja ringan, dan plafon gypsum. Ubah ukuran denah atau tinggi dinding, semua material langsung terhitung otomatis!
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('paket')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors shadow-xs"
                  >
                    <Table2 className="w-3.5 h-3.5 text-slate-950" />
                    <span>Bandingkan Paket Borongan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('denah')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg border border-slate-700 transition-colors shadow-xs"
                  >
                    <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bikin Denah Ruangan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShareModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Akses HP & APK Android</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('material')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
                  >
                    <span>Edit Harga Material</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('takeoff')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-white font-medium rounded-lg border border-slate-700 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>Daftar Kebutuhan Fisik</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split Grid: Configurator & Interactive Visual Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: House Configuration Parameters (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <HouseConfigurator
                  project={currentProject}
                  onChange={handleProjectChange}
                  calculatedHPP={calculation.baseCost}
                  calculatedProfit={calculation.profitAmount}
                  calculatedGrandTotal={calculation.grandTotal}
                  onNavigateToFloorPlan={() => setActiveTab('denah')}
                  onNavigateToComparison={() => setActiveTab('paket')}
                />
              </div>

              {/* Right Column: Dynamic Architectural Diagram & Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
                <HouseElevationDiagram
                  project={currentProject}
                  calculation={calculation}
                />

                {/* Scope & Cost Distribution Summary Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Distribusi Biaya Konstruksi
                    </h3>
                    <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                      {formatRupiah(calculation.grandTotal)}
                    </span>
                  </div>

                  {/* Visual Cost Bar */}
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${calculation.baseCost > 0 ? (calculation.totalMaterialCost / calculation.grandTotal) * 100 : 0}%` }}
                        className="bg-amber-600 h-full"
                        title="Material"
                      />
                      <div
                        style={{ width: `${calculation.baseCost > 0 ? (calculation.totalLaborCost / calculation.grandTotal) * 100 : 0}%` }}
                        className="bg-blue-600 h-full"
                        title="Upah Tenaga"
                      />
                      <div
                        style={{ width: `${calculation.grandTotal > 0 ? (calculation.profitAmount / calculation.grandTotal) * 100 : 0}%` }}
                        className="bg-emerald-600 h-full"
                        title="Keuntungan Kontraktor"
                      />
                      <div
                        style={{ width: `${calculation.grandTotal > 0 ? (calculation.contingencyAmount / calculation.grandTotal) * 100 : 0}%` }}
                        className="bg-slate-400 h-full"
                        title="Cadangan Tak Terduga"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-600 inline-block"></span>
                        Material ({Math.round((calculation.totalMaterialCost / (calculation.grandTotal || 1)) * 100)}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                        Upah ({Math.round((calculation.totalLaborCost / (calculation.grandTotal || 1)) * 100)}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                        Profit ({Math.round((calculation.profitAmount / (calculation.grandTotal || 1)) * 100)}%)
                      </span>
                    </div>
                  </div>

                  {/* Division Breakdown Quick List */}
                  <div className="divide-y divide-slate-100 text-xs pt-1">
                    {calculation.categories
                      .filter(c => c.included)
                      .map(c => (
                        <div key={c.id} className="py-2 flex justify-between items-center text-slate-700">
                          <span className="truncate pr-2">{c.title}</span>
                          <span className="font-mono font-medium text-slate-900 tabular-nums shrink-0">
                            {formatRupiah(c.totalCost)}
                          </span>
                        </div>
                      ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('boq')}
                      className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors"
                    >
                      Buka Rincian BoQ
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('cetak')}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg text-center transition-colors"
                    >
                      Format Cetak Resmi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PERBANDINGAN HITUNGAN PAKET BORONGAN TERPISAH */}
        {activeTab === 'paket' && (
          <div className="space-y-6">
            <PackageComparison
              project={currentProject}
              onSelectScopeMode={(mode) => {
                handleProjectChange({ ...currentProject, scopeMode: mode });
                setQuickSaveNotice(true);
                setTimeout(() => setQuickSaveNotice(false), 2000);
              }}
            />
          </div>
        )}

        {/* DENAH RUMAH (NEW INTERACTIVE FLOOR PLAN DESIGNER) */}
        {activeTab === 'denah' && (
          <div className="space-y-6">
            <FloorPlanDesigner
              project={currentProject}
              onChange={handleProjectChange}
              calculatedGrandTotal={calculation.grandTotal}
            />
          </div>
        )}

        {activeTab === 'material' && (
          <div className="space-y-6">
            <MaterialCatalogEditor
              project={currentProject}
              onChange={handleProjectChange}
            />
          </div>
        )}

        {activeTab === 'takeoff' && (
          <div className="space-y-6">
            <MaterialTakeoffList
              materials={calculation.materialRequirements}
              isLaborOnly={isLaborOnly}
            />
          </div>
        )}

        {activeTab === 'boq' && (
          <div className="space-y-6">
            <BoQTable
              calculation={calculation}
              isLaborOnly={isLaborOnly}
            />
          </div>
        )}

        {activeTab === 'proyek' && (
          <div className="space-y-6">
            <ProjectManager
              currentProject={currentProject}
              savedProjects={savedProjects}
              onSelectProject={handleSelectProject}
              onProjectsListUpdated={handleProjectsListUpdated}
            />
          </div>
        )}

        {activeTab === 'cetak' && (
          <div className="space-y-6">
            <PrintableRABReport
              project={currentProject}
              calculation={calculation}
            />
          </div>
        )}
      </main>

      {/* QUIET FOOTER */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            RAB Rumah Pro · Estimator Bangun Rumah 1 & 2 Lantai · Semen 50kg & Desain Denah
          </div>
          <div className="text-slate-400">
            Disesuaikan dengan Standar Analisa Harga Satuan Pekerjaan (AHSP) & Praktik Lapangan Indonesia
          </div>
        </div>
      </footer>

      {/* SHARE LINK & ANDROID APK MODAL */}
      <ShareAndAndroidModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
      />
    </div>
  );
}
