import React, { useState, useMemo } from 'react';
import { 
  SavedProject, 
  CalculationBreakdown, 
  ProjectScheduleAnalysis, 
  ScheduleWeekData 
} from '../types/rab';
import { formatRupiah } from '../utils/calculator';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Flag, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  RotateCcw, 
  Printer, 
  Download, 
  Layers, 
  Building2, 
  ArrowRight,
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface ProjectScheduleCurveSProps {
  project: SavedProject;
  calculation: CalculationBreakdown;
  onProjectChange: (updated: SavedProject) => void;
  onNavigateToPrint?: () => void;
  onNavigateToAHSP?: () => void;
}

export function ProjectScheduleCurveS({
  project,
  calculation,
  onProjectChange,
  onNavigateToPrint,
  onNavigateToAHSP,
}: ProjectScheduleCurveSProps) {
  const schedule: ProjectScheduleAnalysis = useMemo(() => {
    return calculation.schedule || {
      totalWeeks: 12,
      totalMonths: '2.8',
      estimatedWorkingDays: 72,
      startDate: new Date().toISOString().split('T')[0],
      weeks: [],
      milestones: [],
      peakWeekNumber: 5,
      averageWeeklyWeight: 8.33,
      criticalPathNotes: [],
    };
  }, [calculation]);

  const [hoveredWeek, setHoveredWeek] = useState<ScheduleWeekData | null>(null);
  const [editingActuals, setEditingActuals] = useState(false);

  // Handle start date change
  const handleStartDateChange = (newDateStr: string) => {
    onProjectChange({
      ...project,
      scheduleStartDate: newDateStr,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle duration change (manual override)
  const handleDurationChange = (weeks: number) => {
    const valid = Math.max(6, Math.min(36, weeks));
    onProjectChange({
      ...project,
      scheduleDurationWeeks: valid,
      updatedAt: new Date().toISOString(),
    });
  };

  // Reset duration to automatic recommendation
  const handleResetDuration = () => {
    const nextProject = { ...project };
    delete nextProject.scheduleDurationWeeks;
    onProjectChange({
      ...nextProject,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle actual progress input per week
  const handleActualWeeklyChange = (weekNum: number, value: number) => {
    const val = isNaN(value) ? 0 : Math.max(0, Math.min(100, value));
    const nextActuals = { ...(project.actualProgressPerWeek || {}) };
    if (val === 0 && !project.actualProgressPerWeek?.[weekNum]) {
      delete nextActuals[weekNum];
    } else {
      nextActuals[weekNum] = val;
    }

    onProjectChange({
      ...project,
      actualProgressPerWeek: nextActuals,
      updatedAt: new Date().toISOString(),
    });
  };

  // Clear all actuals
  const handleClearActuals = () => {
    onProjectChange({
      ...project,
      actualProgressPerWeek: {},
      updatedAt: new Date().toISOString(),
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Minggu Ke',
      'Rentang Tanggal',
      'Div. 1 Persiapan & Tanah (%)',
      'Div. 2 Struktur (%)',
      'Div. 3 Pasangan & Finishing (%)',
      'Div. 4 Atap & Plafon (%)',
      'Div. 5 ME & Sanitasi (%)',
      'Bobot Rencana Mingguan (%)',
      'Bobot Rencana Kumulatif (%)',
      'Bobot Aktual Mingguan (%)',
      'Bobot Aktual Kumulatif (%)',
      'Milestone Target',
    ];

    const rows = schedule.weeks.map(w => [
      `Minggu ${w.weekNumber}`,
      `"${w.startDateFormatted} - ${w.endDateFormatted}"`,
      w.divisionWeights.persiapan_tanah.toFixed(2),
      w.divisionWeights.struktur.toFixed(2),
      w.divisionWeights.pasangan_finishing.toFixed(2),
      w.divisionWeights.atap_plafon.toFixed(2),
      w.divisionWeights.me_elektrikal.toFixed(2),
      w.plannedWeeklyPercent.toFixed(2),
      w.plannedCumulativePercent.toFixed(2),
      w.actualWeeklyPercent !== undefined ? w.actualWeeklyPercent.toFixed(2) : '-',
      w.actualCumulativePercent !== undefined ? w.actualCumulativePercent.toFixed(2) : '-',
      `"${w.milestoneTitle || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kurva_S_Jadwal_${project.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG dimensions for S-Curve
  const svgWidth = 800;
  const svgHeight = 320;
  const padding = { top: 25, right: 35, bottom: 45, left: 55 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const totalWeeks = schedule.totalWeeks || 12;
  const weeksData = schedule.weeks;

  // Coordinate mapping helpers
  const getX = (weekIndex: number) => {
    if (totalWeeks <= 1) return padding.left;
    return padding.left + (weekIndex / (totalWeeks - 1)) * graphWidth;
  };

  const getY = (percentage: number) => {
    return padding.top + graphHeight - (Math.max(0, Math.min(100, percentage)) / 100) * graphHeight;
  };

  // Generate Planned S-Curve Path
  const plannedPathD = useMemo(() => {
    if (weeksData.length === 0) return '';
    return weeksData.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(curr.plannedCumulativePercent);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [weeksData, totalWeeks]);

  // Area path for gradient under planned curve
  const plannedAreaD = useMemo(() => {
    if (weeksData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(weeksData.length - 1);
    const bottomY = getY(0);
    return `${plannedPathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [plannedPathD, weeksData, totalWeeks]);

  // Actual Curve Path
  const actualWeeksData = useMemo(() => {
    return weeksData.filter(w => w.actualCumulativePercent !== undefined);
  }, [weeksData]);

  const actualPathD = useMemo(() => {
    if (actualWeeksData.length === 0) return '';
    return actualWeeksData.reduce((acc, curr, idx) => {
      const weekIdx = curr.weekNumber - 1;
      const x = getX(weekIdx);
      const y = getY(curr.actualCumulativePercent || 0);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [actualWeeksData, totalWeeks]);

  // Latest deviation calculation
  const latestActualWeek = actualWeeksData.length > 0 ? actualWeeksData[actualWeeksData.length - 1] : null;
  const currentDeviation = latestActualWeek
    ? Number(((latestActualWeek.actualCumulativePercent || 0) - latestActualWeek.plannedCumulativePercent).toFixed(2))
    : null;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Time Schedule & Manajemen Proyek</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kurva S & Jadwal Pelaksanaan Proyek
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Estimasi durasi waktu pengerjaan pembangunan rumah secara realistis berdasarkan luas bangunan {calculation.totalBuildingArea} m², {project.floors} lantai, dan 5 Divisi Utama AHSP. Pantau progres rencana mingguan (bobot %) dan bandingkan dengan realisasi lapangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor CSV / Excel</span>
            </button>
            {onNavigateToPrint && (
              <button
                type="button"
                onClick={onNavigateToPrint}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Cetak RAB & Jadwal</span>
              </button>
            )}
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          {/* Total Durasi */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <span className="text-2xs text-slate-500 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Total Durasi
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {schedule.totalWeeks} Minggu
            </div>
            <div className="text-2xs text-slate-400 mt-0.5">
              ± {schedule.totalMonths} Bulan ({schedule.estimatedWorkingDays} Hari Kerja)
            </div>
          </div>

          {/* Mulai & Selesai */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <span className="text-2xs text-slate-500 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Mulai Proyek
            </span>
            <div className="text-xs font-bold text-slate-900 mt-1 font-mono">
              {weeksData[0]?.startDateFormatted || '-'}
            </div>
            <div className="text-2xs text-slate-400 mt-0.5">
              Target Serah Terima: {weeksData[weeksData.length - 1]?.endDateFormatted || '-'}
            </div>
          </div>

          {/* Beban Puncak */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <span className="text-2xs text-slate-500 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              Puncak Pekerjaan
            </span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              Minggu {schedule.peakWeekNumber}
            </div>
            <div className="text-2xs text-slate-400 mt-0.5">
              Rata-rata {schedule.averageWeeklyWeight}% / minggu
            </div>
          </div>

          {/* Status Deviasi */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <span className="text-2xs text-slate-500 font-semibold flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-emerald-600" />
              Status Progres Aktual
            </span>
            {currentDeviation !== null ? (
              <div>
                <div className={`text-base font-black mt-0.5 ${
                  currentDeviation >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}>
                  {currentDeviation >= 0 ? `Ahead +${currentDeviation}%` : `Behind ${currentDeviation}%`}
                </div>
                <div className="text-2xs text-slate-500 mt-0.5">
                  Posisi Minggu {latestActualWeek?.weekNumber}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  Siap Dimulai
                </div>
                <div className="text-2xs text-slate-400 mt-0.5">
                  Input progres aktual di tabel
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE SETTINGS & CUSTOMIZER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Pengaturan Jadwal Pelaksanaan Proyek
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Start date input */}
            <div className="flex items-center gap-1.5">
              <span className="text-2xs font-semibold text-slate-500">Tanggal Mulai:</span>
              <input
                type="date"
                value={schedule.startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="px-2.5 py-1 text-xs font-mono font-medium border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Duration slider */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              <span className="text-2xs font-semibold text-slate-600 whitespace-nowrap">
                Durasi: <strong>{schedule.totalWeeks} Mgg</strong>
              </span>
              <input
                type="range"
                min={6}
                max={32}
                step={1}
                value={schedule.totalWeeks}
                onChange={e => handleDurationChange(parseInt(e.target.value, 10))}
                className="w-24 sm:w-32 accent-amber-600 cursor-pointer"
              />
              {project.scheduleDurationWeeks && (
                <button
                  type="button"
                  onClick={handleResetDuration}
                  className="text-slate-400 hover:text-amber-700 p-0.5"
                  title="Kembalikan ke durasi kalkulasi otomatis"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Toggle edit actuals */}
            <button
              type="button"
              onClick={() => setEditingActuals(!editingActuals)}
              className={`px-3 py-1 text-2xs font-bold rounded-lg border transition-colors ${
                editingActuals
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {editingActuals ? 'Selesai Input Aktual' : 'Input Progres Aktual (%)'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: VISUAL KURVA S GRAPH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Grafik Kurva S (Kumulatif Rencana vs Aktual)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Garis 'S' menunjukkan akumulasi bobot pekerjaan: lambat saat persiapan, curam saat struktur & pasangan, landai di finishing
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-2xs"></span>
              <span className="font-semibold text-slate-700">Rencana (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block shadow-2xs"></span>
              <span className="font-semibold text-slate-700">Aktual Lapangan (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-slate-200 inline-block"></span>
              <span className="text-slate-500 text-2xs">Bobot Mingguan</span>
            </div>
          </div>
        </div>

        {/* SVG Container */}
        <div className="w-full overflow-x-auto bg-slate-900 rounded-xl p-3 sm:p-4 text-white relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[650px] overflow-visible select-none font-sans"
          >
            <defs>
              {/* Gradient for planned area */}
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>

              {/* Gradient for actual line glow */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid lines (horizontal percentages: 0%, 25%, 50%, 75%, 100%) */}
            {[0, 25, 50, 75, 100].map(pct => {
              const y = getY(pct);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray={pct === 0 || pct === 100 ? '0' : '4 4'}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Weekly Bars (Planned Weekly %) */}
            {weeksData.map((w, idx) => {
              const x = getX(idx);
              const barWidth = Math.max(6, (graphWidth / totalWeeks) * 0.65);
              const barHeight = (w.plannedWeeklyPercent / 20) * (graphHeight * 0.35); // normalized height scale
              const barY = padding.top + graphHeight - barHeight;

              return (
                <rect
                  key={`bar-${w.weekNumber}`}
                  x={x - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="#475569"
                  opacity="0.55"
                  rx="2"
                />
              );
            })}

            {/* Area Fill Planned */}
            <path d={plannedAreaD} fill="url(#curveGradient)" />

            {/* Planned S-Curve Line */}
            <path
              d={plannedPathD}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Actual Curve Line (if any data) */}
            {actualPathD && (
              <path
                d={actualPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            )}

            {/* Points & Interactive Tooltips on Planned curve */}
            {weeksData.map((w, idx) => {
              const x = getX(idx);
              const y = getY(w.plannedCumulativePercent);
              const isHovered = hoveredWeek?.weekNumber === w.weekNumber;
              const hasActual = w.actualCumulativePercent !== undefined;
              const actualY = hasActual ? getY(w.actualCumulativePercent || 0) : null;
              const isMilestone = Boolean(w.milestoneTitle);

              return (
                <g key={`pt-${w.weekNumber}`}>
                  {/* Vertical guide line on hover */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + graphHeight}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Milestone flag marker */}
                  {isMilestone && (
                    <g transform={`translate(${x}, ${y - 12})`}>
                      <circle r="4" fill="#38bdf8" />
                      <line x1="0" y1="4" x2="0" y2="12" stroke="#38bdf8" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* Planned Point Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={isHovered ? '#ffffff' : '#f59e0b'}
                    stroke="#1e293b"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredWeek(w)}
                    onMouseLeave={() => setHoveredWeek(null)}
                  />

                  {/* Actual Point Circle */}
                  {actualY !== null && (
                    <circle
                      cx={x}
                      cy={actualY}
                      r={isHovered ? 6.5 : 4.5}
                      fill={isHovered ? '#ffffff' : '#10b981'}
                      stroke="#064e3b"
                      strokeWidth="2"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredWeek(w)}
                      onMouseLeave={() => setHoveredWeek(null)}
                    />
                  )}

                  {/* X-axis week labels */}
                  <text
                    x={x}
                    y={padding.top + graphHeight + 18}
                    fill={isHovered ? '#fbbf24' : '#94a3b8'}
                    fontSize={totalWeeks > 20 ? '8' : '9.5'}
                    textAnchor="middle"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontFamily="monospace"
                  >
                    W{w.weekNumber}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating / Bottom Tooltip */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
            {hoveredWeek ? (
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-amber-400 font-mono">
                  Minggu {hoveredWeek.weekNumber} ({hoveredWeek.startDateFormatted} - {hoveredWeek.endDateFormatted})
                </span>
                <span className="text-slate-300">
                  Rencana Minggu Ini: <strong className="text-white">{hoveredWeek.plannedWeeklyPercent}%</strong>
                </span>
                <span className="text-slate-300">
                  Rencana Kumulatif: <strong className="text-amber-300">{hoveredWeek.plannedCumulativePercent}%</strong>
                </span>
                {hoveredWeek.actualCumulativePercent !== undefined && (
                  <span className="text-slate-300">
                    Aktual: <strong className="text-emerald-400">{hoveredWeek.actualCumulativePercent}%</strong>
                  </span>
                )}
                {hoveredWeek.milestoneTitle && (
                  <span className="text-sky-300 text-2xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                    ★ {hoveredWeek.milestoneTitle}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-slate-400 text-2xs italic flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>Arahkan kursor ke titik grafik untuk melihat rincian bobot dan tanggal setiap minggu.</span>
              </div>
            )}

            <div className="text-2xs text-slate-400 font-mono shrink-0">
              Target: 100% Selesai Sempurna
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: 5 KEY MILESTONES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
          <Flag className="w-4 h-4 text-amber-600" />
          <span>Milestone & Target Utama Pelaksanaan</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Titik pemeriksaan mutu dan serah terima parsial pekerjaan
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {schedule.milestones.map((m, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all ${
                m.status === 'completed'
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-2xs font-semibold mb-1">
                <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                  Minggu {m.week}
                </span>
                <span className="font-mono text-slate-600 font-bold">
                  {m.targetPercent}%
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                {m.title}
              </h4>
              <p className="text-2xs text-slate-500 mt-1.5 leading-relaxed">
                {m.description}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1 text-2xs">
                {m.status === 'completed' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai
                  </span>
                ) : (
                  <span className="text-slate-400">Target Pelaksanaan</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: DETAILED WEEKLY BREAKDOWN TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Tabel Breakdown Bobot Jadwal Pelaksanaan (Mingguan)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian bobot 5 Divisi AHSP, target rencana, dan input progres aktual per minggu
            </p>
          </div>

          {editingActuals && (
            <button
              type="button"
              onClick={handleClearActuals}
              className="px-2.5 py-1 text-2xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors self-start sm:self-auto"
            >
              Hapus Semua Progres Aktual
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
                <th className="py-2.5 px-3 whitespace-nowrap">Minggu</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Rentang Waktu</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Persiapan (%)</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Struktur (%)</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Pasangan/Fin (%)</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Atap/Plafon (%)</th>
                <th className="py-2.5 px-2.5 text-right whitespace-nowrap">ME (%)</th>
                <th className="py-2.5 px-3 text-right bg-amber-50/50 font-bold whitespace-nowrap text-amber-900">
                  Rencana Mg (%)
                </th>
                <th className="py-2.5 px-3 text-right bg-amber-100/50 font-bold whitespace-nowrap text-amber-950">
                  Kumulatif (%)
                </th>
                <th className="py-2.5 px-3 text-right bg-emerald-50/50 font-bold whitespace-nowrap text-emerald-900">
                  Aktual (%)
                </th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Deviasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-2xs">
              {weeksData.map(w => {
                const hasActual = w.actualWeeklyPercent !== undefined;
                const deviation = hasActual && w.actualCumulativePercent !== undefined
                  ? Number((w.actualCumulativePercent - w.plannedCumulativePercent).toFixed(2))
                  : null;

                const isPeak = w.weekNumber === schedule.peakWeekNumber;

                return (
                  <tr
                    key={w.weekNumber}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isPeak ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Minggu # */}
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      W{w.weekNumber}
                      {w.milestoneTitle && (
                        <span className="ml-1 text-2xs text-amber-600 font-sans" title={w.milestoneTitle}>
                          ★
                        </span>
                      )}
                    </td>

                    {/* Rentang Tanggal */}
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-sans">
                      {w.startDateFormatted} - {w.endDateFormatted}
                    </td>

                    {/* Divisi 1: Persiapan */}
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {w.divisionWeights.persiapan_tanah > 0 ? w.divisionWeights.persiapan_tanah.toFixed(2) : '-'}
                    </td>

                    {/* Divisi 2: Struktur */}
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {w.divisionWeights.struktur > 0 ? w.divisionWeights.struktur.toFixed(2) : '-'}
                    </td>

                    {/* Divisi 3: Pasangan/Finishing */}
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {w.divisionWeights.pasangan_finishing > 0 ? w.divisionWeights.pasangan_finishing.toFixed(2) : '-'}
                    </td>

                    {/* Divisi 4: Atap/Plafon */}
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {w.divisionWeights.atap_plafon > 0 ? w.divisionWeights.atap_plafon.toFixed(2) : '-'}
                    </td>

                    {/* Divisi 5: ME */}
                    <td className="py-2.5 px-2.5 text-right text-slate-600">
                      {w.divisionWeights.me_elektrikal > 0 ? w.divisionWeights.me_elektrikal.toFixed(2) : '-'}
                    </td>

                    {/* Rencana Mingguan */}
                    <td className="py-2.5 px-3 text-right font-bold text-amber-900 bg-amber-50/30">
                      {w.plannedWeeklyPercent.toFixed(2)}%
                    </td>

                    {/* Rencana Kumulatif */}
                    <td className="py-2.5 px-3 text-right font-black text-amber-950 bg-amber-100/30">
                      {w.plannedCumulativePercent.toFixed(2)}%
                    </td>

                    {/* Aktual Mingguan Input / Display */}
                    <td className="py-1.5 px-2.5 text-right bg-emerald-50/20">
                      {editingActuals ? (
                        <input
                          type="number"
                          step={0.1}
                          min={0}
                          max={100}
                          value={w.actualWeeklyPercent !== undefined ? w.actualWeeklyPercent : ''}
                          onChange={e => handleActualWeeklyChange(w.weekNumber, parseFloat(e.target.value))}
                          placeholder="-"
                          className="w-16 px-1.5 py-1 text-right font-mono text-2xs font-bold border border-emerald-300 rounded bg-white text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span className="font-bold text-emerald-800">
                          {w.actualWeeklyPercent !== undefined ? `${w.actualWeeklyPercent.toFixed(2)}%` : '-'}
                        </span>
                      )}
                    </td>

                    {/* Deviasi */}
                    <td className="py-2.5 px-3 text-right">
                      {deviation !== null ? (
                        <span className={`font-bold ${
                          deviation >= 0 ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {deviation >= 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-mono font-bold text-2xs text-slate-900">
                <td colSpan={7} className="py-2.5 px-3 text-right font-sans">
                  Total Bobot Rencana:
                </td>
                <td className="py-2.5 px-3 text-right text-amber-900">
                  100.00%
                </td>
                <td className="py-2.5 px-3 text-right text-amber-950">
                  100.00%
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-900">
                  {latestActualWeek?.actualCumulativePercent !== undefined
                    ? `${latestActualWeek.actualCumulativePercent.toFixed(2)}%`
                    : '-'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {currentDeviation !== null ? (
                    <span className={currentDeviation >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                      {currentDeviation >= 0 ? `+${currentDeviation}%` : `${currentDeviation}%`}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION: JALUR KRITIS & REKOMENDASI TEKNIK */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Pedoman Jalur Kritis (Critical Path) & Kualitas Pengerjaan</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-2xs text-slate-600">
          {schedule.criticalPathNotes.map((note, i) => (
            <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-100">
              <ChevronRight className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
