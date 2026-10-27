/**
 * Database Standar Upah Tenaga Kerja Konstruksi Berdasarkan Wilayah Operasional
 * Sumber Referensi: Standar Harga Satuan Upah Pekerja PUPR & Realita Pasar Pemborong Indonesia
 */

import { RegionalWageBenchmark, WorkerWageRates, SavedProject } from '../types/rab';

export const REGIONAL_WAGE_BENCHMARKS: RegionalWageBenchmark[] = [
  {
    id: 'jabodetabek',
    name: 'DKI Jakarta & Jabodetabek',
    province: 'DKI Jakarta / Banten / Jawa Barat',
    tier: 'Tier 1 (Metropolitan)',
    notes: 'Wilayah Jakarta, Bogor, Depok, Tangerang, Bekasi. Standar proyek perumahan klaster & residensial mandiri.',
    rates: {
      mandor: 210000,
      kepalaTukang: 190000,
      tukangBatu: 165000,
      tukangKayu: 165000,
      tukangBesi: 165000,
      tukangCat: 150000,
      tukangListrik: 180000,
      tukangPipa: 165000,
      tukangAtap: 175000,
      pekerja: 130000,
      boronganM2Full: 1250000,
      boronganM2Ngaci: 700000,
    },
  },
  {
    id: 'jawa_barat',
    name: 'Jawa Barat (Bandung Raya, Cirebon, dsk.)',
    province: 'Jawa Barat',
    tier: 'Tier 2 (Urban)',
    notes: 'Wilayah Kota/Kab. Bandung, Cimahi, Cirebon, Tasikmalaya, Sukabumi. Mobilitas tenaga kerja lokal tinggi.',
    rates: {
      mandor: 190000,
      kepalaTukang: 175000,
      tukangBatu: 150000,
      tukangKayu: 150000,
      tukangBesi: 150000,
      tukangCat: 140000,
      tukangListrik: 165000,
      tukangPipa: 150000,
      tukangAtap: 160000,
      pekerja: 115000,
      boronganM2Full: 1100000,
      boronganM2Ngaci: 630000,
    },
  },
  {
    id: 'jawa_tengah',
    name: 'Jawa Tengah (Semarang, Solo, Purwokerto)',
    province: 'Jawa Tengah',
    tier: 'Tier 2 (Reguler)',
    notes: 'Wilayah Semarang, Surakarta/Solo, Banyumas, Pekalongan, Kudus. Basis tukang batu dan kayu berpengalaman.',
    rates: {
      mandor: 175000,
      kepalaTukang: 160000,
      tukangBatu: 135000,
      tukangKayu: 135000,
      tukangBesi: 135000,
      tukangCat: 125000,
      tukangListrik: 150000,
      tukangPipa: 135000,
      tukangAtap: 145000,
      pekerja: 105000,
      boronganM2Full: 950000,
      boronganM2Ngaci: 550000,
    },
  },
  {
    id: 'diy',
    name: 'D.I. Yogyakarta (Sleman, Bantul, Jogja)',
    province: 'D.I. Yogyakarta',
    tier: 'Tier 2 (Reguler)',
    notes: 'Wilayah Kota Yogyakarta, Sleman, Bantul, Kulon Progo, Gunungkidul. Kualitas pengerjaan rapi & teliti.',
    rates: {
      mandor: 170000,
      kepalaTukang: 155000,
      tukangBatu: 135000,
      tukangKayu: 135000,
      tukangBesi: 135000,
      tukangCat: 125000,
      tukangListrik: 150000,
      tukangPipa: 135000,
      tukangAtap: 145000,
      pekerja: 100000,
      boronganM2Full: 950000,
      boronganM2Ngaci: 540000,
    },
  },
  {
    id: 'jawa_timur',
    name: 'Jawa Timur (Surabaya, Sidoarjo, Malang)',
    province: 'Jawa Timur',
    tier: 'Tier 1/2 (Urban Industri)',
    notes: 'Wilayah Surabaya Raya (Surabaya, Gresik, Sidoarjo) dan Malang Raya. Produktivitas tinggi dan tempo cepat.',
    rates: {
      mandor: 195000,
      kepalaTukang: 180000,
      tukangBatu: 155000,
      tukangKayu: 155000,
      tukangBesi: 155000,
      tukangCat: 145000,
      tukangListrik: 170000,
      tukangPipa: 155000,
      tukangAtap: 165000,
      pekerja: 120000,
      boronganM2Full: 1150000,
      boronganM2Ngaci: 650000,
    },
  },
  {
    id: 'bali',
    name: 'Bali (Denpasar, Badung, Gianyar)',
    province: 'Bali',
    tier: 'Tier 1 (Pariwisata & Residensial)',
    notes: 'Wilayah Denpasar, Badung, Gianyar, Tabanan. Kebutuhan finishing estetis tinggi (villa & hunian privat).',
    rates: {
      mandor: 220000,
      kepalaTukang: 200000,
      tukangBatu: 175000,
      tukangKayu: 180000,
      tukangBesi: 175000,
      tukangCat: 160000,
      tukangListrik: 190000,
      tukangPipa: 175000,
      tukangAtap: 185000,
      pekerja: 135000,
      boronganM2Full: 1350000,
      boronganM2Ngaci: 750000,
    },
  },
  {
    id: 'sumatera_utara',
    name: 'Sumatera Utara (Medan & Deli Serdang)',
    province: 'Sumatera Utara',
    tier: 'Tier 2 (Regional Hub)',
    notes: 'Wilayah Kota Medan, Binjai, Deli Serdang. Proyek ruko dan rumah tapak perkotaan.',
    rates: {
      mandor: 190000,
      kepalaTukang: 175000,
      tukangBatu: 150000,
      tukangKayu: 150000,
      tukangBesi: 150000,
      tukangCat: 140000,
      tukangListrik: 165000,
      tukangPipa: 150000,
      tukangAtap: 160000,
      pekerja: 115000,
      boronganM2Full: 1100000,
      boronganM2Ngaci: 620000,
    },
  },
  {
    id: 'sumatera_selatan_riau',
    name: 'Sumatera Selatan & Riau (Palembang, Pekanbaru)',
    province: 'Sumatera',
    tier: 'Tier 2 (Reguler)',
    notes: 'Wilayah Palembang, Pekanbaru, Batam/Kepri. Karakteristik lahan gambut/rawa memerlukan keahlian pondasi khusus.',
    rates: {
      mandor: 195000,
      kepalaTukang: 180000,
      tukangBatu: 155000,
      tukangKayu: 155000,
      tukangBesi: 155000,
      tukangCat: 140000,
      tukangListrik: 170000,
      tukangPipa: 155000,
      tukangAtap: 165000,
      pekerja: 120000,
      boronganM2Full: 1150000,
      boronganM2Ngaci: 650000,
    },
  },
  {
    id: 'kalimantan_timur',
    name: 'Kalimantan Timur (Balikpapan, Samarinda, IKN)',
    province: 'Kalimantan Timur',
    tier: 'Tier 1 (Ekspansi & IKN)',
    notes: 'Wilayah Balikpapan, Samarinda, PPU / Nusantara (IKN). Permintaan tenaga kerja konstruksi sangat tinggi.',
    rates: {
      mandor: 240000,
      kepalaTukang: 220000,
      tukangBatu: 195000,
      tukangKayu: 195000,
      tukangBesi: 195000,
      tukangCat: 180000,
      tukangListrik: 210000,
      tukangPipa: 195000,
      tukangAtap: 205000,
      pekerja: 150000,
      boronganM2Full: 1450000,
      boronganM2Ngaci: 820000,
    },
  },
  {
    id: 'sulawesi_selatan',
    name: 'Sulawesi Selatan (Makassar & Sekitarnya)',
    province: 'Sulawesi Selatan',
    tier: 'Tier 2 (Regional Hub)',
    notes: 'Wilayah Kota Makassar, Maros, Gowa. Pusat pertumbuhan residensial kawasan Indonesia Timur.',
    rates: {
      mandor: 190000,
      kepalaTukang: 175000,
      tukangBatu: 150000,
      tukangKayu: 155000,
      tukangBesi: 150000,
      tukangCat: 140000,
      tukangListrik: 165000,
      tukangPipa: 150000,
      tukangAtap: 160000,
      pekerja: 115000,
      boronganM2Full: 1100000,
      boronganM2Ngaci: 630000,
    },
  },
];

export const DEFAULT_OPERATIONAL_REGION_ID = 'jabodetabek';

export interface WorkerRoleMeta {
  key: keyof WorkerWageRates;
  title: string;
  shortDesc: string;
  category: 'supervisi' | 'spesialis' | 'helper' | 'borongan';
  sniCode?: string;
}

export const WORKER_ROLE_METAS: WorkerRoleMeta[] = [
  {
    key: 'mandor',
    title: 'Mandor Proyek',
    shortDesc: 'Pengawas harian, logistik material, pengatur target kerja tukang & absensi',
    category: 'supervisi',
    sniCode: 'L.04',
  },
  {
    key: 'kepalaTukang',
    title: 'Kepala Tukang',
    shortDesc: 'Pimpinan teknis lapangan, membaca gambar kerja & memastikan presisi siku/level',
    category: 'supervisi',
    sniCode: 'L.03',
  },
  {
    key: 'tukangBatu',
    title: 'Tukang Batu & Cor',
    shortDesc: 'Pondasi batu kali/cakar ayam, pasang bata merah/hebel, plester & acian halus',
    category: 'spesialis',
    sniCode: 'L.02a',
  },
  {
    key: 'tukangKayu',
    title: 'Tukang Kayu & Bekisting',
    shortDesc: 'Pembuatan bekisting cor sloof/kolom/balok, perancah dak & kusen pintu/jendela',
    category: 'spesialis',
    sniCode: 'L.02b',
  },
  {
    key: 'tukangBesi',
    title: 'Tukang Besi Beton',
    shortDesc: 'Pemotongan, pembengkokan beugel/sengkang, perakitan tulangan kolom & wiremesh dak',
    category: 'spesialis',
    sniCode: 'L.02c',
  },
  {
    key: 'tukangCat',
    title: 'Tukang Cat & Finishing',
    shortDesc: 'Aplikasi cat dasar alkali sealer, cat interior/eksterior weatherproof & dempul',
    category: 'spesialis',
    sniCode: 'L.02d',
  },
  {
    key: 'tukangListrik',
    title: 'Tukang Listrik (ME)',
    shortDesc: 'Pemasangan pipa conduit in-bow, penarikan kabel NYM, MCB box & fitting lampu',
    category: 'spesialis',
    sniCode: 'L.02e',
  },
  {
    key: 'tukangPipa',
    title: 'Tukang Pipa & Sanitair',
    shortDesc: 'Instalasi pipa air bersih AW, air kotor & limbah WC, septic tank serta kloset',
    category: 'spesialis',
    sniCode: 'L.02f',
  },
  {
    key: 'tukangAtap',
    title: 'Tukang Atap & Plafon',
    shortDesc: 'Perakitan kuda-kuda baja ringan C75, reng, genteng metal pasir & plafon gypsum/PVC',
    category: 'spesialis',
    sniCode: 'L.02g',
  },
  {
    key: 'pekerja',
    title: 'Pekerja / Kenek / Laden',
    shortDesc: 'Pengaduk adukan semen & pasir, lansir material, galian tanah & pembantu tukang',
    category: 'helper',
    sniCode: 'L.01',
  },
];

/**
 * Mendapatkan upah tenaga kerja efektif untuk suatu proyek
 * Memprioritaskan input manual kustom, lalu fallback ke wilayah operasional terpilih
 */
export function getEffectiveWorkerWages(project: Partial<SavedProject>): WorkerWageRates {
  const regionId = project.operationalRegionId || DEFAULT_OPERATIONAL_REGION_ID;
  const benchmark = REGIONAL_WAGE_BENCHMARKS.find(r => r.id === regionId) || REGIONAL_WAGE_BENCHMARKS[0];
  const baseRates = { ...benchmark.rates };

  // Terapkan override manual jika ada
  if (project.customWorkerWages) {
    (Object.keys(project.customWorkerWages) as (keyof WorkerWageRates)[]).forEach(role => {
      const customVal = project.customWorkerWages?.[role];
      if (typeof customVal === 'number' && customVal > 0) {
        baseRates[role] = customVal;
      }
    });
  }

  // Jika ada laborRateOverrides warisan untuk 'tukang_kepala', 'tukang_batu', dsb
  if (project.laborRateOverrides) {
    if (project.laborRateOverrides['tukang_kepala']) {
      baseRates.kepalaTukang = project.laborRateOverrides['tukang_kepala'];
    }
    if (project.laborRateOverrides['tukang_batu']) {
      baseRates.tukangBatu = project.laborRateOverrides['tukang_batu'];
    }
    if (project.laborRateOverrides['pekerja_kenek']) {
      baseRates.pekerja = project.laborRateOverrides['pekerja_kenek'];
    }
    if (project.laborRateOverrides['upah_borongan_m2_full']) {
      baseRates.boronganM2Full = project.laborRateOverrides['upah_borongan_m2_full'];
    }
    if (project.laborRateOverrides['upah_borongan_m2_ngaci']) {
      baseRates.boronganM2Ngaci = project.laborRateOverrides['upah_borongan_m2_ngaci'];
    }
  }

  return baseRates;
}
