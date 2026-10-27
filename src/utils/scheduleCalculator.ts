/**
 * Project Scheduling & S-Curve Calculation Engine (Jadwal Proyek & Kurva S)
 * Mengestimasi durasi pengerjaan pembangunan rumah secara realistis berdasarkan:
 * - Jumlah lantai (1 vs 2 lantai)
 * - Luas bangunan (m²)
 * - Jenis pondasi (batu kali, footplat, cakar ayam, strauss pile)
 * - Lingkup pekerjaan (s/d ngaci, finish keramik/cat, turnkey buka kunci)
 * - 5 Divisi Utama AHSP (Persiapan, Struktur, Pasangan/Finishing, Atap/Plafon, ME)
 */

import { 
  SavedProject, 
  CalculationBreakdown, 
  ProjectScheduleAnalysis, 
  ScheduleWeekData, 
  MilestoneScheduleItem,
  AHSPDivisionId 
} from '../types/rab';
import { isLaborOnlyScope } from './calculator';

/**
 * Estimasi durasi standar pembangunan rumah dalam satuan minggu
 */
export function estimateProjectDurationWeeks(project: SavedProject): number {
  if (project.scheduleDurationWeeks && project.scheduleDurationWeeks > 0) {
    return Math.max(4, Math.min(52, project.scheduleDurationWeeks));
  }

  const floors = project.floors || 1;
  const totalArea = project.groundFloorArea + (floors === 2 ? project.secondFloorArea : 0);
  const foundationType = project.foundationType || 'footplat';
  const mode = project.scopeMode;

  let baseWeeks: number;

  if (floors === 1) {
    if (totalArea <= 40) {
      baseWeeks = 8;
    } else if (totalArea <= 65) {
      baseWeeks = 10;
    } else if (totalArea <= 100) {
      baseWeeks = 12;
    } else if (totalArea <= 150) {
      baseWeeks = 15;
    } else {
      baseWeeks = 18;
    }
  } else {
    // 2 Lantai: memerlukan waktu curing plat dak beton bertulang (minimal 21 hari bekisting)
    if (totalArea <= 80) {
      baseWeeks = 16;
    } else if (totalArea <= 120) {
      baseWeeks = 18;
    } else if (totalArea <= 180) {
      baseWeeks = 22;
    } else if (totalArea <= 250) {
      baseWeeks = 26;
    } else {
      baseWeeks = 30;
    }
  }

  // Penyesuaian jenis pondasi
  if (foundationType === 'strauss_pile' || foundationType === 'cakar_ayam') {
    baseWeeks += 1;
  }

  // Penyesuaian lingkup pekerjaan
  if (mode === 'ngaci_tanpa_plafon' || mode === 'allin_ngaci_tanpa_plafon' || mode === 'upah_ngaci_tanpa_plafon') {
    // Tanpa plafon, keramik, pengecatan, sanitair
    baseWeeks = Math.max(6, Math.round(baseWeeks * 0.72));
  } else if (mode === 'ngaci_dengan_plafon' || mode === 'allin_ngaci_dengan_plafon' || mode === 'upah_ngaci_dengan_plafon') {
    baseWeeks = Math.max(7, Math.round(baseWeeks * 0.80));
  } else if (mode === 'upah_finish_keramik_cat' || mode === 'allin_finish_keramik_cat') {
    baseWeeks = Math.max(8, Math.round(baseWeeks * 0.92));
  }

  return baseWeeks;
}

/**
 * Format tanggal Indonesia pendek: "03 Mar 2025"
 */
export function formatIndonesianDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Menghitung analisis Kurva S dan jadwal mingguan proyek
 */
export function calculateProjectSchedule(
  project: SavedProject, 
  calc: CalculationBreakdown
): ProjectScheduleAnalysis {
  const totalWeeks = estimateProjectDurationWeeks(project);
  const estimatedWorkingDays = totalWeeks * 6; // 6 hari kerja per minggu
  const totalMonths = (totalWeeks / 4.33).toFixed(1);

  // Parse start date
  let startDate = new Date();
  if (project.scheduleStartDate) {
    const parsed = new Date(project.scheduleStartDate);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed;
    }
  }

  // Ambil bobot anggaran riil masing-masing divisi AHSP
  let divisionBudgets: Record<AHSPDivisionId, number> = {
    persiapan_tanah: 0,
    struktur: 0,
    pasangan_finishing: 0,
    atap_plafon: 0,
    me_elektrikal: 0,
  };

  if (calc.ahspDivisions && calc.ahspDivisions.length > 0) {
    calc.ahspDivisions.forEach(div => {
      divisionBudgets[div.id] = div.totalCost || div.clientTotalCost || 0;
    });
  } else {
    // Fallback proporsional jika belum dihitung
    const total = calc.grandTotal || 100000000;
    divisionBudgets = {
      persiapan_tanah: total * 0.04,
      struktur: total * 0.38,
      pasangan_finishing: total * 0.34,
      atap_plafon: total * 0.15,
      me_elektrikal: total * 0.09,
    };
  }

  const grandTotalCost = Object.values(divisionBudgets).reduce((a, b) => a + b, 0) || 1;
  const divisionWeightPercents: Record<AHSPDivisionId, number> = {
    persiapan_tanah: (divisionBudgets.persiapan_tanah / grandTotalCost) * 100,
    struktur: (divisionBudgets.struktur / grandTotalCost) * 100,
    pasangan_finishing: (divisionBudgets.pasangan_finishing / grandTotalCost) * 100,
    atap_plafon: (divisionBudgets.atap_plafon / grandTotalCost) * 100,
    me_elektrikal: (divisionBudgets.me_elektrikal / grandTotalCost) * 100,
  };

  // Definisikan rentang minggu aktif tiap divisi (proporsional 0..1 sepanjang total durasi)
  // Divisi 1: Persiapan & Tanah -> 0% s/d 18% dari total durasi
  // Divisi 2: Struktur -> 10% s/d 50% (atau 60% jika 2 lantai)
  // Divisi 3: Pasangan & Finishing -> 35% s/d 92%
  // Divisi 4: Atap & Plafon -> 40% s/d 78%
  // Divisi 5: ME & Sanitasi -> 45% s/d 96%
  const is2Floors = (project.floors || 1) === 2;
  const structEndRatio = is2Floors ? 0.58 : 0.48;

  const divisionWindows: Record<AHSPDivisionId, { startRatio: number; endRatio: number; peakRatio: number }> = {
    persiapan_tanah: { startRatio: 0.0, endRatio: 0.20, peakRatio: 0.08 },
    struktur: { startRatio: 0.10, endRatio: structEndRatio, peakRatio: 0.28 },
    atap_plafon: { startRatio: 0.38, endRatio: 0.76, peakRatio: 0.55 },
    pasangan_finishing: { startRatio: 0.32, endRatio: 0.94, peakRatio: 0.65 },
    me_elektrikal: { startRatio: 0.45, endRatio: 0.98, peakRatio: 0.75 },
  };

  // Bangun bobot mingguan mentah tiap divisi menggunakan kurva Gaussian/Trapezoid
  const rawWeeklyDivisionWeights: Record<AHSPDivisionId, number[]> = {
    persiapan_tanah: new Array(totalWeeks).fill(0),
    struktur: new Array(totalWeeks).fill(0),
    pasangan_finishing: new Array(totalWeeks).fill(0),
    atap_plafon: new Array(totalWeeks).fill(0),
    me_elektrikal: new Array(totalWeeks).fill(0),
  };

  (Object.keys(divisionWindows) as AHSPDivisionId[]).forEach(divId => {
    const win = divisionWindows[divId];
    const totalDivWeight = divisionWeightPercents[divId];
    if (totalDivWeight <= 0) return;

    const startWeek = Math.max(0, Math.floor(win.startRatio * totalWeeks));
    const endWeek = Math.min(totalWeeks - 1, Math.ceil(win.endRatio * totalWeeks));
    const peakWeek = Math.round(win.peakRatio * totalWeeks);

    let rawSum = 0;
    const tempWeights: number[] = new Array(totalWeeks).fill(0);

    for (let w = 0; w < totalWeeks; w++) {
      if (w >= startWeek && w <= endWeek) {
        // Curve weighting around peakWeek
        const dist = Math.abs(w - peakWeek);
        const span = Math.max(1, (endWeek - startWeek) / 2);
        // Cosine/bell bell shaping
        const shape = Math.max(0.05, Math.cos((dist / span) * (Math.PI / 2.2)));
        tempWeights[w] = shape;
        rawSum += shape;
      }
    }

    if (rawSum > 0) {
      for (let w = 0; w < totalWeeks; w++) {
        rawWeeklyDivisionWeights[divId][w] = (tempWeights[w] / rawSum) * totalDivWeight;
      }
    }
  });

  // Susun data mingguan
  const weeks: ScheduleWeekData[] = [];
  let plannedCumulative = 0;
  let peakWeekNumber = 1;
  let maxWeeklyPercent = 0;

  for (let w = 0; w < totalWeeks; w++) {
    const weekNum = w + 1;
    
    // Hitung tanggal mulai dan tanggal selesai minggu
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (w * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const divWeights: Record<AHSPDivisionId, number> = {
      persiapan_tanah: Number(rawWeeklyDivisionWeights.persiapan_tanah[w].toFixed(2)),
      struktur: Number(rawWeeklyDivisionWeights.struktur[w].toFixed(2)),
      pasangan_finishing: Number(rawWeeklyDivisionWeights.pasangan_finishing[w].toFixed(2)),
      atap_plafon: Number(rawWeeklyDivisionWeights.atap_plafon[w].toFixed(2)),
      me_elektrikal: Number(rawWeeklyDivisionWeights.me_elektrikal[w].toFixed(2)),
    };

    let weeklyPlanned = Object.values(divWeights).reduce((a, b) => a + b, 0);
    
    // Pastikan minggu terakhir mencapai tepat 100% kumulatif
    if (w === totalWeeks - 1) {
      weeklyPlanned = Number((100 - plannedCumulative).toFixed(2));
      plannedCumulative = 100;
    } else {
      plannedCumulative = Number((plannedCumulative + weeklyPlanned).toFixed(2));
    }

    if (weeklyPlanned > maxWeeklyPercent) {
      maxWeeklyPercent = weeklyPlanned;
      peakWeekNumber = weekNum;
    }

    // Ambil data progres aktual jika diinput oleh pengguna
    const actualWeekly = project.actualProgressPerWeek?.[weekNum];

    weeks.push({
      weekNumber: weekNum,
      weekLabel: `Minggu ${weekNum}`,
      startDateFormatted: formatIndonesianDate(weekStart),
      endDateFormatted: formatIndonesianDate(weekEnd),
      plannedWeeklyPercent: Number(weeklyPlanned.toFixed(2)),
      plannedCumulativePercent: Number(plannedCumulative.toFixed(2)),
      actualWeeklyPercent: actualWeekly !== undefined ? actualWeekly : undefined,
      actualCumulativePercent: undefined, // dihitung di bawah
      divisionWeights: divWeights,
    });
  }

  // Hitung kumulatif aktual jika ada input
  let runningActualCumulative = 0;
  let hasActuals = false;
  weeks.forEach(w => {
    if (w.actualWeeklyPercent !== undefined) {
      runningActualCumulative += w.actualWeeklyPercent;
      w.actualCumulativePercent = Number(Math.min(100, runningActualCumulative).toFixed(2));
      hasActuals = true;
    }
  });

  // Tentukan 5 Milestone Proyek Realistis
  const m1Week = Math.max(1, Math.round(totalWeeks * 0.18));
  const m2Week = Math.max(m1Week + 1, Math.round(totalWeeks * (is2Floors ? 0.52 : 0.42)));
  const m3Week = Math.max(m2Week + 1, Math.round(totalWeeks * 0.68));
  const m4Week = Math.max(m3Week + 1, Math.round(totalWeeks * 0.88));
  const m5Week = totalWeeks;

  const milestones: MilestoneScheduleItem[] = [
    {
      week: m1Week,
      title: 'Pembersihan & Pondasi Selesai',
      description: `Bouwplank presisi, galian, dan cor pondasi ${project.foundationType?.replace('_', ' ') || 'tapak'} tuntas 100%.`,
      targetPercent: weeks[m1Week - 1]?.plannedCumulativePercent || 15,
      status: (weeks[m1Week - 1]?.actualCumulativePercent || 0) >= 15 ? 'completed' : 'upcoming',
    },
    {
      week: m2Week,
      title: is2Floors ? 'Struktur Lantai 1 & Plat Dak Cor' : 'Struktur Beton Bertulang (Sloof & Kolom)',
      description: is2Floors 
        ? 'Pengecoran sloof, kolom lt 1, balok & plat dak lantai 2 selesai dan masa perawatan beton.'
        : 'Sloof, pembesian kolom praktis, dan ringbalk pengikat dinding selesai.',
      targetPercent: weeks[m2Week - 1]?.plannedCumulativePercent || 45,
      status: (weeks[m2Week - 1]?.actualCumulativePercent || 0) >= 45 ? 'completed' : 'upcoming',
    },
    {
      week: m3Week,
      title: 'Tutup Atap & Dinding Plesteran',
      description: `Kuda-kuda baja ringan, genteng terpasang rapi, dan dinding ${project.wallType === 'hebel' ? 'hebel' : 'bata'} selesai diplester.`,
      targetPercent: weeks[m3Week - 1]?.plannedCumulativePercent || 70,
      status: (weeks[m3Week - 1]?.actualCumulativePercent || 0) >= 70 ? 'completed' : 'upcoming',
    },
    {
      week: m4Week,
      title: 'Plafon, Keramik & Acian Semen 50kg',
      description: `Plafon ${project.ceilingType === 'pvc' ? 'PVC' : 'gypsum'} terpasang, lantai keramik terpasang rapi, dan acian halus kering.`,
      targetPercent: weeks[m4Week - 1]?.plannedCumulativePercent || 88,
      status: (weeks[m4Week - 1]?.actualCumulativePercent || 0) >= 88 ? 'completed' : 'upcoming',
    },
    {
      week: m5Week,
      title: 'Finishing Cat, ME & Serah Terima Kunci',
      description: 'Pengecekan akhir, cat eksterior/interior tuntas, fitting sanitair/listrik hidup, siap huni.',
      targetPercent: 100,
      status: (weeks[m5Week - 1]?.actualCumulativePercent || 0) >= 100 ? 'completed' : 'upcoming',
    },
  ];

  // Tempelkan label milestone ke minggu yang bersangkutan
  milestones.forEach(m => {
    if (weeks[m.week - 1]) {
      weeks[m.week - 1].milestoneTitle = m.title;
    }
  });

  const averageWeeklyWeight = Number((100 / totalWeeks).toFixed(2));

  const criticalPathNotes = [
    is2Floors 
      ? 'Jalur Kritis: Masa tunggu pengerasan beton plat lantai 2 (minimal 21 hari) sebelum pelepasan bekisting penopang.'
      : 'Jalur Kritis: Pengecoran sloof dan kolom struktur sebelum pemasangan dinding hebel/bata.',
    'Pekerjaan plesteran dinding harus kering sempurna (kadar air < 12%) sebelum aplikasi cat dasar alkali sealer.',
    'Pemasangan atap genteng harus selesai sebelum instalasi plafon interior untuk menghindari kebocoran akibat air hujan.',
    'Uji tekan pipa air bersih (10 bar) dan tes rendam lantai kamar mandi dilakukan sebelum pemasangan keramik.',
  ];

  return {
    totalWeeks,
    totalMonths,
    estimatedWorkingDays,
    startDate: startDate.toISOString().split('T')[0],
    weeks,
    milestones,
    peakWeekNumber,
    averageWeeklyWeight,
    criticalPathNotes,
  };
}
