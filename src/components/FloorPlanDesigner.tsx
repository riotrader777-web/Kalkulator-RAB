import React, { useState } from 'react';
import { SavedProject, RoomPlanItem, RoomType } from '../types/rab';
import { formatNumber, formatRupiah } from '../utils/calculator';
import { 
  Plus, 
  Trash2, 
  Maximize2, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Grid, 
  LayoutTemplate,
  Sliders,
  Home,
  Building2
} from 'lucide-react';

interface FloorPlanDesignerProps {
  project: SavedProject;
  onChange: (updated: SavedProject) => void;
  calculatedGrandTotal: number;
}

const ROOM_TYPE_CONFIG: Record<RoomType, { label: string; bg: string; border: string; text: string }> = {
  bedroom: { label: 'Kamar Tidur', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' },
  living: { label: 'Ruang Tamu / Keluarga', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-900' },
  bathroom: { label: 'Kamar Mandi / WC', bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900' },
  kitchen: { label: 'Dapur & Ruang Makan', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
  terrace: { label: 'Teras / Balkon', bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-900' },
  dining: { label: 'Ruang Makan', bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900' },
  carport: { label: 'Carport / Garasi', bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-900' },
  service: { label: 'Ruang Cuci / Jemur', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900' },
  other: { label: 'Ruangan Lain', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800' },
};

export const FloorPlanDesigner: React.FC<FloorPlanDesignerProps> = ({
  project,
  onChange,
  calculatedGrandTotal,
}) => {
  const [activeFloorView, setActiveFloorView] = useState<1 | 2>(1);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  
  // New Room Form state
  const [newRoomName, setNewRoomName] = useState('Kamar Tidur Baru');
  const [newRoomType, setNewRoomType] = useState<RoomType>('bedroom');
  const [newRoomLength, setNewRoomLength] = useState(3.5);
  const [newRoomWidth, setNewRoomWidth] = useState(3.0);
  const [newRoomFloor, setNewRoomFloor] = useState<1 | 2>(activeFloorView);

  const rooms = project.floorPlanRooms || [];
  const currentFloorRooms = rooms.filter(r => r.floor === activeFloorView);

  const updateRooms = (newRooms: RoomPlanItem[], autoSync = project.useFloorPlanSync) => {
    // If sync is enabled, recalculate ground & second floor area
    const sumF1 = newRooms.filter(r => r.floor === 1).reduce((acc, r) => acc + (r.length * r.width), 0);
    const sumF2 = newRooms.filter(r => r.floor === 2).reduce((acc, r) => acc + (r.length * r.width), 0);

    onChange({
      ...project,
      floorPlanRooms: newRooms,
      useFloorPlanSync: autoSync,
      groundFloorArea: autoSync && sumF1 > 0 ? Number(sumF1.toFixed(1)) : project.groundFloorArea,
      secondFloorArea: autoSync && project.floors === 2 ? Number(sumF2.toFixed(1)) : project.secondFloorArea,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleSync = (checked: boolean) => {
    updateRooms(rooms, checked);
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoom: RoomPlanItem = {
      id: 'room_' + Date.now(),
      name: newRoomName.trim() || 'Ruangan Baru',
      type: newRoomType,
      floor: newRoomFloor,
      length: Math.max(1, newRoomLength),
      width: Math.max(1, newRoomWidth),
      area: Number((newRoomLength * newRoomWidth).toFixed(2)),
    };
    updateRooms([...rooms, newRoom]);
    setShowAddRoomModal(false);
    setNewRoomName('');
  };

  const handleDeleteRoom = (id: string) => {
    updateRooms(rooms.filter(r => r.id !== id));
  };

  const handleUpdateRoomDimension = (id: string, length: number, width: number) => {
    const updated = rooms.map(r => {
      if (r.id === id) {
        return {
          ...r,
          length: Math.max(1, length),
          width: Math.max(1, width),
          area: Number((length * width).toFixed(2)),
        };
      }
      return r;
    });
    updateRooms(updated);
  };

  const handleApplyPreset = (presetName: 'tipe36' | 'tipe45' | 'tipe60' | 'tipe100_2lt') => {
    let presetRooms: RoomPlanItem[] = [];
    let floors: 1 | 2 = 1;

    if (presetName === 'tipe36') {
      floors = 1;
      presetRooms = [
        { id: 'p36_1', name: 'Teras Depan', floor: 1, length: 3.0, width: 1.5, area: 4.5, type: 'terrace' },
        { id: 'p36_2', name: 'Ruang Tamu & Keluarga', floor: 1, length: 3.5, width: 3.0, area: 10.5, type: 'living' },
        { id: 'p36_3', name: 'Kamar Tidur Utama', floor: 1, length: 3.0, width: 3.0, area: 9.0, type: 'bedroom' },
        { id: 'p36_4', name: 'Kamar Tidur 2', floor: 1, length: 3.0, width: 2.5, area: 7.5, type: 'bedroom' },
        { id: 'p36_5', name: 'Kamar Mandi / WC', floor: 1, length: 1.75, width: 1.5, area: 2.62, type: 'bathroom' },
        { id: 'p36_6', name: 'Dapur Terbuka', floor: 1, length: 2.5, width: 1.5, area: 3.75, type: 'kitchen' },
      ];
    } else if (presetName === 'tipe45') {
      floors = 1;
      presetRooms = [
        { id: 'p45_1', name: 'Teras Depan', floor: 1, length: 3.0, width: 1.5, area: 4.5, type: 'terrace' },
        { id: 'p45_2', name: 'Ruang Tamu & Utama', floor: 1, length: 4.0, width: 3.0, area: 12.0, type: 'living' },
        { id: 'p45_3', name: 'Kamar Tidur Utama', floor: 1, length: 3.5, width: 3.0, area: 10.5, type: 'bedroom' },
        { id: 'p45_4', name: 'Kamar Tidur Anak', floor: 1, length: 3.0, width: 3.0, area: 9.0, type: 'bedroom' },
        { id: 'p45_5', name: 'Dapur & Meja Makan', floor: 1, length: 3.0, width: 2.0, area: 6.0, type: 'kitchen' },
        { id: 'p45_6', name: 'Kamar Mandi', floor: 1, length: 2.0, width: 1.5, area: 3.0, type: 'bathroom' },
      ];
    } else if (presetName === 'tipe60') {
      floors = 1;
      presetRooms = [
        { id: 'p60_1', name: 'Teras Depan', floor: 1, length: 3.5, width: 1.5, area: 5.25, type: 'terrace' },
        { id: 'p60_2', name: 'Ruang Tamu', floor: 1, length: 3.5, width: 3.0, area: 10.5, type: 'living' },
        { id: 'p60_3', name: 'Ruang Keluarga & Makan', floor: 1, length: 4.0, width: 3.5, area: 14.0, type: 'living' },
        { id: 'p60_4', name: 'Kamar Tidur Utama', floor: 1, length: 3.5, width: 3.5, area: 12.25, type: 'bedroom' },
        { id: 'p60_5', name: 'Kamar Tidur 2', floor: 1, length: 3.0, width: 3.0, area: 9.0, type: 'bedroom' },
        { id: 'p60_6', name: 'Kamar Tidur 3', floor: 1, length: 3.0, width: 2.5, area: 7.5, type: 'bedroom' },
        { id: 'p60_7', name: 'Dapur Bersih', floor: 1, length: 3.0, width: 2.5, area: 7.5, type: 'kitchen' },
        { id: 'p60_8', name: 'Kamar Mandi Utama', floor: 1, length: 2.0, width: 1.75, area: 3.5, type: 'bathroom' },
      ];
    } else if (presetName === 'tipe100_2lt') {
      floors = 2;
      presetRooms = [
        // Lantai 1
        { id: 'p100_1', name: 'Carport & Teras', floor: 1, length: 4.5, width: 3.0, area: 13.5, type: 'terrace' },
        { id: 'p100_2', name: 'Ruang Tamu & Keluarga', floor: 1, length: 5.0, width: 3.5, area: 17.5, type: 'living' },
        { id: 'p100_3', name: 'Kamar Tidur Tamu (Lt 1)', floor: 1, length: 3.5, width: 3.0, area: 10.5, type: 'bedroom' },
        { id: 'p100_4', name: 'Dapur & Ruang Makan', floor: 1, length: 4.0, width: 3.0, area: 12.0, type: 'kitchen' },
        { id: 'p100_5', name: 'Kamar Mandi Lt 1', floor: 1, length: 2.0, width: 1.5, area: 3.0, type: 'bathroom' },
        // Lantai 2
        { id: 'p100_6', name: 'Kamar Tidur Utama (Master)', floor: 2, length: 4.5, width: 3.5, area: 15.75, type: 'bedroom' },
        { id: 'p100_7', name: 'Kamar Tidur Anak 1', floor: 2, length: 3.5, width: 3.0, area: 10.5, type: 'bedroom' },
        { id: 'p100_8', name: 'Kamar Tidur Anak 2', floor: 2, length: 3.0, width: 3.0, area: 9.0, type: 'bedroom' },
        { id: 'p100_9', name: 'Ruang Santai Lt 2', floor: 2, length: 3.5, width: 3.0, area: 10.5, type: 'living' },
        { id: 'p100_10', name: 'Kamar Mandi Lt 2', floor: 2, length: 2.0, width: 2.0, area: 4.0, type: 'bathroom' },
        { id: 'p100_11', name: 'Balkon Atas', floor: 2, length: 3.0, width: 1.5, area: 4.5, type: 'terrace' },
      ];
    }

    const sumF1 = presetRooms.filter(r => r.floor === 1).reduce((acc, r) => acc + (r.length * r.width), 0);
    const sumF2 = presetRooms.filter(r => r.floor === 2).reduce((acc, r) => acc + (r.length * r.width), 0);

    onChange({
      ...project,
      floors,
      floorPlanRooms: presetRooms,
      useFloorPlanSync: true,
      groundFloorArea: Number(sumF1.toFixed(1)),
      secondFloorArea: floors === 2 ? Number(sumF2.toFixed(1)) : 0,
      updatedAt: new Date().toISOString(),
    });
  };

  const totalPlanArea = rooms.reduce((acc, r) => acc + (r.length * r.width), 0);
  const floor1PlanArea = rooms.filter(r => r.floor === 1).reduce((acc, r) => acc + (r.length * r.width), 0);
  const floor2PlanArea = rooms.filter(r => r.floor === 2).reduce((acc, r) => acc + (r.length * r.width), 0);
  const bathroomCount = rooms.filter(r => r.type === 'bathroom').length;
  const bedroomCount = rooms.filter(r => r.type === 'bedroom').length;

  return (
    <div className="space-y-6">
      {/* HEADER & SYNC CONTROLS */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700">
                <LayoutTemplate className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Desainer Denah Ruangan & Sinkronisasi Otomatis RAB
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atur dan tambahkan ruangan (Kamar, Dapur, KM, Ruang Tamu). Ukuran tiap ruangan langsung menghitung total luas lantai, dinding sekat, kusen pintu, sanitasi, dan material RAB secara otomatis.
            </p>
          </div>

          {/* Sync Switch */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${project.useFloorPlanSync ? 'animate-spin-slow' : ''}`} />
                <span>Hitung Otomatis ke RAB</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {project.useFloorPlanSync ? 'Luas & Dinding RAB tersinkron dari denah ini' : 'Denah terpisah dari angka manual RAB'}
              </span>
            </div>
            <input
              type="checkbox"
              id="chkSyncFloorPlan"
              checked={project.useFloorPlanSync ?? false}
              onChange={(e) => handleToggleSync(e.target.checked)}
              className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* TEMPLATE DENAH PRESETS */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1">Contoh Denah Siap Pakai:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('tipe36')}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Tipe 36 (2 KT + 1 KM)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('tipe45')}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Tipe 45 (2 KT Lega)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('tipe60')}
            className="text-xs px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Tipe 60 (3 KT + 2 KM)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('tipe100_2lt')}
            className="text-xs px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 font-medium transition-colors"
          >
            2 Lantai Tipe 100 (3 KT + Balkon)
          </button>
        </div>

        {/* DENAH STATS BAR */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Total Luas Denah</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">{formatNumber(totalPlanArea)} m²</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Lantai 1 / Lantai 2</span>
            <span className="text-xs font-semibold text-slate-800 tabular-nums">
              {formatNumber(floor1PlanArea)} m² {project.floors === 2 ? `/ ${formatNumber(floor2PlanArea)} m²` : ''}
            </span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Jumlah Kamar Tidur</span>
            <span className="text-sm font-bold text-amber-800 tabular-nums">{bedroomCount} Kamar</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <span className="text-[11px] text-slate-500 block">Jumlah Kamar Mandi</span>
            <span className="text-sm font-bold text-cyan-800 tabular-nums">{bathroomCount} Unit (WC)</span>
          </div>
          <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200/60">
            <span className="text-[11px] text-emerald-800 block font-medium">Grand Total RAB</span>
            <span className="text-xs font-bold text-emerald-950 font-mono tabular-nums">{formatRupiah(calculatedGrandTotal)}</span>
          </div>
        </div>
      </div>

      {/* FLOOR SWITCHER (If 2 floors) */}
      {project.floors === 2 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2 px-3 shadow-xs">
          <span className="text-xs font-semibold text-slate-700">Tampilkan Denah:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveFloorView(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeFloorView === 1
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Denah Lantai 1 ({formatNumber(floor1PlanArea)} m²)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFloorView(2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeFloorView === 2
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Denah Lantai 2 ({formatNumber(floor2PlanArea)} m²)</span>
            </button>
          </div>
        </div>
      )}

      {/* 2D ARCHITECTURAL BLUEPRINT VISUALIZATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Tata Letak Denah 2D (Lantai {activeFloorView})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {currentFloorRooms.length} Ruangan Terpasang
          </span>
        </div>

        {/* Blueprint Layout Grid */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 min-h-[280px] flex flex-col justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentFloorRooms.map((room) => {
              const cfg = ROOM_TYPE_CONFIG[room.type] || ROOM_TYPE_CONFIG.other;
              return (
                <div
                  key={room.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 text-white flex flex-col justify-between hover:border-amber-500/80 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                        {cfg.label}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1">{room.name}</h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                      {room.area} m²
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono tabular-nums">
                      {room.length}m x {room.width}m
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">Pintu & Jendela: 1 set</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {currentFloorRooms.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                Belum ada ruangan di Lantai {activeFloorView}. Klik tombol &quot;Tambah Ruangan&quot; di bawah untuk menambahkan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROOMS TABLE & IN-PLACE DIMENSION EDITORS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Daftar & Edit Ukuran Ruangan (Lantai {activeFloorView})
          </h3>
          <button
            type="button"
            onClick={() => {
              setNewRoomFloor(activeFloorView);
              setShowAddRoomModal(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Ruangan Baru</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">No</th>
                <th className="py-2.5 px-4">Nama Ruangan</th>
                <th className="py-2.5 px-4 w-40">Tipe Fungsi</th>
                <th className="py-2.5 px-4 text-center w-28">Panjang (m)</th>
                <th className="py-2.5 px-4 text-center w-28">Lebar (m)</th>
                <th className="py-2.5 px-4 text-right w-28">Luas (m²)</th>
                <th className="py-2.5 px-4 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {currentFloorRooms.map((room, idx) => {
                const cfg = ROOM_TYPE_CONFIG[room.type] || ROOM_TYPE_CONFIG.other;
                return (
                  <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {room.name}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.text} font-medium`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        step="0.25"
                        value={room.length ?? 1}
                        onChange={(e) => handleUpdateRoomDimension(room.id, parseFloat(e.target.value) || 1, room.width ?? 1)}
                        className="w-20 px-2 py-1 text-center font-mono font-semibold border border-slate-300 rounded focus:border-amber-500 focus:outline-none tabular-nums"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="number"
                        min="1"
                        max="20"
                        step="0.25"
                        value={room.width ?? 1}
                        onChange={(e) => handleUpdateRoomDimension(room.id, room.length ?? 1, parseFloat(e.target.value) || 1)}
                        className="w-20 px-2 py-1 text-center font-mono font-semibold border border-slate-300 rounded focus:border-amber-500 focus:outline-none tabular-nums"
                      />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatNumber(room.area)} m²
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Hapus ruangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ADD ROOM */}
      {showAddRoomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Tambah Ruangan ke Denah</h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan nama ruangan, fungsi ruangan, dan ukuran panjang x lebar.
            </p>

            <form onSubmit={handleAddRoom} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Ruangan
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName ?? ''}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Kamar Tidur Utama, Dapur Basah, Musholla"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fungsi Ruangan
                  </label>
                  <select
                    value={newRoomType ?? 'bedroom'}
                    onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                  >
                    {Object.keys(ROOM_TYPE_CONFIG).map(t => (
                      <option key={t} value={t}>
                        {ROOM_TYPE_CONFIG[t as RoomType].label}
                      </option>
                    ))}
                  </select>
                </div>

                {project.floors === 2 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Penempatan Lantai
                    </label>
                    <select
                      value={newRoomFloor ?? 1}
                      onChange={(e) => setNewRoomFloor(parseInt(e.target.value) as 1 | 2)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                    >
                      <option value={1}>Lantai 1</option>
                      <option value={2}>Lantai 2</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang Ruangan (m)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.25"
                    value={newRoomLength ?? 3.5}
                    onChange={(e) => setNewRoomLength(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar Ruangan (m)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.25"
                    value={newRoomWidth ?? 3.0}
                    onChange={(e) => setNewRoomWidth(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs flex justify-between items-center text-amber-950">
                <span>Luas Ruangan Baru:</span>
                <span className="font-bold font-mono">
                  {formatNumber(newRoomLength * newRoomWidth)} m²
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md shadow-xs"
                >
                  Tambahkan ke Denah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
