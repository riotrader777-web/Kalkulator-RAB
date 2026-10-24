import React, { useState } from 'react';
import { PhysicalMaterialRequirement, MaterialCategory } from '../types/rab';
import { formatNumber, formatRupiah } from '../utils/calculator';
import { Package, Download, Search } from 'lucide-react';

interface MaterialTakeoffListProps {
  materials: PhysicalMaterialRequirement[];
  isLaborOnly: boolean;
}

const CATEGORY_NAMES: Record<MaterialCategory, string> = {
  agregat_semen: 'Semen, Pasir & Split',
  dinding: 'Bata & Dinding',
  besi_kawat: 'Besi Beton & Kawat Bendrat',
  atap: 'Rangka Atap & Genteng',
  plafon: 'Plafon (Gypsum / PVC)',
  lantai: 'Lantai Granit & Keramik',
  finishing: 'Cat & Finishing',
  sanitair_listrik: 'Pipa, Sanitair & Listrik',
};

export const MaterialTakeoffList: React.FC<MaterialTakeoffListProps> = ({
  materials,
  isLaborOnly,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = materials.filter(m => {
    const matchesCat = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalProcurementCost = materials.reduce((acc, m) => acc + m.totalCost, 0);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,Nama Material,Kategori,Kebutuhan Fisik,Satuan,Harga Satuan (Rp),Total Biaya (Rp),Catatan\n';
    materials.forEach((m, idx) => {
      csvContent += `${idx + 1},"${m.name}","${CATEGORY_NAMES[m.category]}",${m.quantity},"${m.unit}",${m.unitPrice},${m.totalCost},"${m.notes || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Kebutuhan_Material_RAB_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span>Daftar Kebutuhan Fisik Material (Material Takeoff)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rincian kuantitas fisik material yang dibutuhkan untuk belanja ke toko bangunan/supplier.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh CSV Belanja</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search ?? ''}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kebutuhan material..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({materials.length})
            </button>
            {['agregat_semen', 'dinding', 'besi_kawat', 'atap', 'plafon', 'lantai'].map((catKey) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setFilterCategory(catKey)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                  filterCategory === catKey
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {CATEGORY_NAMES[catKey as MaterialCategory]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLaborOnly && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 flex items-center justify-between">
          <span>
            ℹ️ <strong>Mode Upah Tenaga Saja Aktif:</strong> Biaya material tidak masuk ke tagihan penawaran pemborong (dibeli mandiri oleh pemilik), namun daftar kuantitas fisik di bawah ini tetap valid sebagai panduan belanja pemilik rumah.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Nama Material</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4 text-right w-28">Kebutuhan Fisik</th>
              <th className="py-3 px-4 text-center w-20">Satuan</th>
              <th className="py-3 px-4 text-right w-32">Harga Satuan</th>
              <th className="py-3 px-4 text-right w-36">Subtotal Biaya</th>
              <th className="py-3 px-4">Catatan Peruntukan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filtered.map((item, idx) => (
              <tr key={item.materialId} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                  {idx + 1}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  {item.name}
                </td>
                <td className="py-3 px-4">
                  <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {CATEGORY_NAMES[item.category]}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-amber-900 font-mono text-sm tabular-nums">
                  {formatNumber(item.quantity)}
                </td>
                <td className="py-3 px-4 text-center font-medium text-slate-600">
                  {item.unit}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                  {formatRupiah(item.unitPrice)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                  {isLaborOnly ? (
                    <span className="text-slate-400 font-normal">Mandiri ({formatRupiah(item.totalCost)})</span>
                  ) : (
                    formatRupiah(item.totalCost)
                  )}
                </td>
                <td className="py-3 px-4 text-[11px] text-slate-500">
                  {item.notes}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
            <tr>
              <td colSpan={6} className="py-3 px-4 text-right text-slate-700">
                Total Estimasi Biaya Pengadaan Material:
              </td>
              <td className="py-3 px-4 text-right text-sm text-slate-900 font-mono tabular-nums">
                {formatRupiah(totalProcurementCost)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
