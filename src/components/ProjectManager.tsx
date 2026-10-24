import React, { useState } from 'react';
import { SavedProject } from '../types/rab';
import { formatRupiah } from '../utils/calculator';
import { 
  saveProject, 
  deleteProject, 
  duplicateProject, 
  exportProjectsToJson 
} from '../utils/storage';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  FileText, 
  Check, 
  Calendar,
  Building,
  Layers
} from 'lucide-react';

interface ProjectManagerProps {
  currentProject: SavedProject;
  savedProjects: SavedProject[];
  onSelectProject: (project: SavedProject) => void;
  onProjectsListUpdated: (list: SavedProject[]) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentProject,
  savedProjects,
  onSelectProject,
  onProjectsListUpdated,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState(currentProject?.name || '');
  const [saveClient, setSaveClient] = useState(currentProject?.clientName || '');
  const [saveLocation, setSaveLocation] = useState(currentProject?.location || '');
  const [saveNotes, setSaveNotes] = useState(currentProject?.notes || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  React.useEffect(() => {
    setSaveName(currentProject?.name || '');
    setSaveClient(currentProject?.clientName || '');
    setSaveLocation(currentProject?.location || '');
    setSaveNotes(currentProject?.notes || '');
  }, [currentProject]);

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SavedProject = {
      ...currentProject,
      name: saveName.trim() || currentProject.name,
      clientName: saveClient.trim(),
      location: saveLocation.trim(),
      notes: saveNotes.trim(),
      updatedAt: new Date().toISOString(),
    };
    const newList = saveProject(updated);
    onProjectsListUpdated(newList);
    onSelectProject(updated);
    setShowSaveModal(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2000);
  };

  const handleNewProject = () => {
    const newId = 'proj_' + Date.now();
    const fresh: SavedProject = {
      ...currentProject,
      id: newId,
      name: `Proyek Baru RAB #${savedProjects.length + 1}`,
      clientName: '',
      location: '',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newList = saveProject(fresh);
    onProjectsListUpdated(newList);
    onSelectProject(fresh);
  };

  const handleDuplicate = (proj: SavedProject) => {
    const { project: copy, list } = duplicateProject(proj);
    onProjectsListUpdated(list);
    onSelectProject(copy);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus data proyek "${name}"?`)) {
      const newList = deleteProject(id);
      onProjectsListUpdated(newList);
      if (currentProject.id === id) {
        onSelectProject(newList[0]);
      }
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge imported
          let currentList = [...savedProjects];
          parsed.forEach((imported: SavedProject) => {
            if (imported.id && imported.name) {
              const idx = currentList.findIndex(p => p.id === imported.id);
              if (idx >= 0) {
                currentList[idx] = imported;
              } else {
                currentList.push(imported);
              }
            }
          });
          localStorage.setItem('rab_rumah_saved_projects_v1', JSON.stringify(currentList));
          onProjectsListUpdated(currentList);
          alert(`Berhasil mengimpor ${parsed.length} data proyek RAB.`);
        } else {
          alert('Format berkas JSON tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-amber-600" />
            <span>Manajemen & Riwayat Proyek RAB Tersimpan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simpan perhitungan RAB Anda, muat kembali proyek sebelumnya, atau gandakan untuk membuat variasi penawaran.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveSuccessMsg && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" /> Tersimpan
            </span>
          )}

          <label className="cursor-pointer inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Impor JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => exportProjectsToJson(savedProjects)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor Semua</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSaveName(currentProject?.name || '');
              setSaveClient(currentProject?.clientName || '');
              setSaveLocation(currentProject?.location || '');
              setSaveNotes(currentProject?.notes || '');
              setShowSaveModal(true);
            }}
            className="inline-flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Simpan Proyek Ini</span>
          </button>

          <button
            type="button"
            onClick={handleNewProject}
            className="inline-flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* Grid of Saved Projects */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedProjects.map((p) => {
          const isActive = p.id === currentProject.id;
          const totalArea = p.groundFloorArea + (p.floors === 2 ? p.secondFloorArea : 0);
          const scopeLabel = 
            p.scopeMode === 'turnkey' ? 'Buka Kunci' :
            p.scopeMode === 'labor_only' ? 'Upah Tenaga' :
            p.scopeMode === 'ngaci_tanpa_plafon' ? 's/d Ngaci (Tanpa Plafon)' :
            p.scopeMode === 'ngaci_dengan_plafon' ? 's/d Ngaci + Plafon' : 'Kustom';

          return (
            <div
              key={p.id}
              className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-amber-500 bg-amber-50/20 shadow-sm ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">
                    {p.name}
                  </h3>
                  {isActive && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-slate-500 mb-3">
                  {p.clientName && (
                    <div className="text-slate-700 font-medium truncate">
                      Klien: {p.clientName} {p.location ? `· ${p.location}` : ''}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Layers className="w-3 h-3 text-slate-400" />
                      {p.floors} Lantai ({totalArea} m²)
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Building className="w-3 h-3 text-slate-400" />
                      Tinggi: {p.wallHeight}m
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {scopeLabel}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.updatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {p.notes && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-md mb-3">
                    {p.notes}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectProject(p)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-center transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isActive ? 'Sedang Dikerjakan' : 'Buka Proyek'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDuplicate(p)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  title="Duplikat proyek ini"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                {savedProjects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus proyek"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Simpan Data Proyek RAB</h3>
            <p className="text-xs text-slate-500 mb-4">
              Beri nama dan informasi identitas proyek untuk memudahkan pencarian di masa mendatang.
            </p>

            <form onSubmit={handleSaveCurrent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Proyek Bangunan
                </label>
                <input
                  type="text"
                  required
                  value={saveName ?? ''}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Rumah Tinggal 2 Lantai Ibu Ratna"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Klien / Pemilik
                  </label>
                  <input
                    type="text"
                    value={saveClient ?? ''}
                    onChange={(e) => setSaveClient(e.target.value)}
                    placeholder="e.g. Ibu Ratna"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Proyek
                  </label>
                  <input
                    type="text"
                    value={saveLocation ?? ''}
                    onChange={(e) => setSaveLocation(e.target.value)}
                    placeholder="e.g. Bandung Barat"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Proyek / Spesifikasi Khusus
                </label>
                <textarea
                  rows={3}
                  value={saveNotes ?? ''}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  placeholder="Catatan tambahan mengenai spesifikasi keramik, cat, atau tahapan pengerjaan..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs"
                >
                  Simpan Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
