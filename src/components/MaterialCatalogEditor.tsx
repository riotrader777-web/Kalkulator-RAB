import React, { useState } from 'react';
import { MaterialCategory, SavedProject } from '../types/rab';
import { DEFAULT_MATERIALS } from '../data/defaultCatalog';
import { formatRupiah } from '../utils/calculator';
import { Search, RotateCcw, Plus, Check } from 'lucide-react';

interface MaterialCatalogEditorProps {
  project: SavedProject;
  onChange: (updated: SavedProject) => void;
}

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  agregat_semen: 'Semen, Pasir & Split',
  dinding: 'Bata & Dinding',
  besi_kawat: 'Besi Beton & Kawat Bendrat',
  atap: 'Rangka Atap & Genteng',
  plafon: 'Plafon (Gypsum & PVC)',
  lantai: 'Lantai Granit & Keramik',
  finishing: 'Cat & Finishing',
  sanitair_listrik: 'Pipa, Sanitair & Listrik',
};

export const MaterialCatalogEditor: React.FC<MaterialCatalogEditorProps> = ({
  project,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Custom Material state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('satuan');
  const [newMatPrice, setNewMatPrice] = useState(100000);
  const [newMatCategory, setNewMatCategory] = useState<MaterialCategory>('agregat_semen');

  const overrides = project.materialPriceOverrides || {};

  const handlePriceChange = (id: string, newPrice: number) => {
    const updatedOverrides = {
      ...overrides,
      [id]: Math.max(0, newPrice),
    };
    onChange({
      ...project,
      materialPriceOverrides: updatedOverrides,
      updatedAt: new Date().toISOString(),
    });
    triggerSuccess();
  };

  const handleResetItem = (id: string) => {
    const updated = { ...overrides };
    delete updated[id];
    onChange({
      ...project,
      materialPriceOverrides: updated,
      updatedAt: new Date().toISOString(),
    });
    triggerSuccess();
  };

  const handleResetAll = () => {
    if (window.confirm('Kembalikan semua harga material ke harga standar pasar Indonesia?')) {
      onChange({
        ...project,
        materialPriceOverrides: {},
        updatedAt: new Date().toISOString(),
      });
      triggerSuccess();
    }
  };

  const triggerSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleAddCustomMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const customId = 'custom_' + Date.now();
    const updatedOverrides = {
      ...overrides,
      [customId]: newMatPrice,
    };

    // Also register in custom materials list if needed
    onChange({
      ...project,
      materialPriceOverrides: updatedOverrides,
      updatedAt: new Date().toISOString(),
    });

    setNewMatName('');
    setShowAddModal(false);
    triggerSuccess();
  };

  // Filter materials
  const filteredMaterials = DEFAULT_MATERIALS.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const modifiedCount = Object.keys(overrides).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Katalog & Edit Nominal Harga Material Satuan</span>
              {modifiedCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {modifiedCount} Harga Disesuaikan
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sesuaikan nominal harga material (batu split, hebel, bata merah, semen, pasir, besi, kawat bendrat, dll.) mengikuti harga toko material setempat.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {savedSuccess && (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Tersimpan
              </span>
            )}

            {modifiedCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                title="Reset semua ke harga standar"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Standar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Material Kustom</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery ?? ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari material (e.g. semen, hebel, besi 10mm, pasir pasang, split)..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({DEFAULT_MATERIALS.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Material Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Material & Spesifikasi</th>
              <th className="py-3 px-4 w-36">Kategori</th>
              <th className="py-3 px-4 w-24 text-center">Satuan</th>
              <th className="py-3 px-4 w-36 text-right">Harga Standar</th>
              <th className="py-3 px-4 w-48 text-right">Harga Satuan Saat Ini (Rp)</th>
              <th className="py-3 px-4 w-20 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredMaterials.map((item, index) => {
              const currentPrice = overrides[item.id] !== undefined ? overrides[item.id] : item.defaultPrice;
              const isModified = overrides[item.id] !== undefined && overrides[item.id] !== item.defaultPrice;

              return (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isModified ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    {item.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-700">
                    {item.unit}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono tabular-nums">
                    {formatRupiah(item.defaultPrice)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <span className="text-slate-400 text-[11px]">Rp</span>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={currentPrice ?? 0}
                        onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                        className={`w-32 px-2.5 py-1 text-right text-xs font-semibold rounded border focus:outline-none focus:ring-1 tabular-nums font-mono ${
                          isModified
                            ? 'border-amber-500 bg-amber-50/50 text-amber-950 focus:ring-amber-500 font-bold'
                            : 'border-slate-300 bg-white text-slate-800 focus:ring-slate-400'
                        }`}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {isModified && (
                      <button
                        type="button"
                        onClick={() => handleResetItem(item.id)}
                        className="text-[11px] text-slate-500 hover:text-amber-700 hover:underline inline-flex items-center gap-0.5"
                        title="Kembalikan ke harga standar"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredMaterials.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada material yang sesuai dengan kata kunci &quot;{searchQuery}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add Custom Material */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tambah Material Kustom Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan nama material, satuan, harga per unit, dan kategori.
            </p>

            <form onSubmit={handleAddCustomMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Material
                </label>
                <input
                  type="text"
                  required
                  value={newMatName ?? ''}
                  onChange={(e) => setNewMatName(e.target.value)}
                  placeholder="e.g. Bondek 0.75mm Prima, Kayu Meranti 5/7"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatUnit ?? ''}
                    onChange={(e) => setNewMatUnit(e.target.value)}
                    placeholder="e.g. batang, m³, sak, kg"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={newMatPrice ?? 0}
                    onChange={(e) => setNewMatPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none tabular-nums font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Material
                </label>
                <select
                  value={newMatCategory ?? 'agregat_semen'}
                  onChange={(e) => setNewMatCategory(e.target.value as MaterialCategory)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                >
                  {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow-xs"
                >
                  Simpan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
