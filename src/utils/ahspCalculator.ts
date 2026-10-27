/**
 * Standar Analisa Harga Satuan Pekerjaan (AHSP) Konstruksi Gedung & Perumahan
 * Mengacu pada SNI / Permen PUPR & Praktek Pelaksanaan Pemborong Indonesia.
 * 
 * Membagi rincian ke dalam 5 Divisi Utama:
 * 1. Pekerjaan Persiapan & Tanah
 * 2. Pekerjaan Struktur (Pondasi, Beton Bertulang & Tangga)
 * 3. Pekerjaan Pasangan & Finishing (Bata, Plesteran, Acian Semen 50kg, Keramik & Cat)
 * 4. Pekerjaan Atap & Plafon (Baja Ringan, Genteng, Plafon Gypsum / PVC)
 * 5. Pekerjaan ME (Mekanikal, Elektrikal & Sanitasi)
 */

import { 
  SavedProject, 
  CalculationBreakdown, 
  AHSPDivision, 
  AHSPItemAnalysis, 
  AHSPCoefficient 
} from '../types/rab';
import { isLaborOnlyScope } from './calculator';
import { getEffectiveWorkerWages } from '../data/regionalWages';

export function calculateAHSPAnalysis(
  project: SavedProject, 
  calc: CalculationBreakdown
): { divisions: AHSPDivision[]; allItems: AHSPItemAnalysis[] } {
  const isLaborOnly = isLaborOnlyScope(project.scopeMode);
  const bagWeight = project.cementBagWeight || 50;
  const acianBagWeight = project.acianBagWeight || 50;
  const floors = project.floors || 1;
  const groundArea = calc.groundArea;
  const secondFloorArea = calc.secondFloorArea;
  const totalBuildingArea = calc.totalBuildingArea;
  const wallHeight = calc.wallHeight;
  const approxPerimeter = 2 * (project.houseLength + project.houseWidth);
  const netWallArea = calc.totalWallArea;
  const plasterSkimcoatArea = netWallArea * 1.95;
  const roofArea = calc.roofArea;
  const ceilingArea = calc.ceilingArea;
  const floorTileArea = calc.floorTileArea;
  const ceilingType = project.ceilingType || 'gypsum';
  const foundationType = calc.foundationType;

  // Margin multiplier to compute client unit rate from internal HPP
  const marginMultiplier = calc.baseCost > 0 ? (calc.grandTotal / calc.baseCost) : 1;

  // Dynamic Labor Rates resolved from Regional Database or Manual Custom Overrides
  const workerWages = getEffectiveWorkerWages(project);
  const upahPekerja = workerWages.pekerja;
  const upahTukangBatu = workerWages.tukangBatu;
  const upahTukangKayu = workerWages.tukangKayu;
  const upahTukangBesi = workerWages.tukangBesi;
  const upahTukangCat = workerWages.tukangCat;
  const upahTukangListrik = workerWages.tukangListrik;
  const upahKepalaTukang = workerWages.kepalaTukang;
  const upahMandor = workerWages.mandor;

  // Standard Material Prices per unit
  const hargaSemen50kg = project.materialPriceOverrides?.['semen_portland_50kg'] || 72000;
  const hargaSemenPerKg = hargaSemen50kg / 50;
  const hargaSemenAcian = (acianBagWeight === 50 
    ? (project.materialPriceOverrides?.['semen_acian_50kg'] || 98000) 
    : (project.materialPriceOverrides?.['semen_acian_instant'] || 82000)) / acianBagWeight;
  const hargaPasirBeton = project.materialPriceOverrides?.['pasir_beton'] || 290000;
  const hargaPasirPasang = project.materialPriceOverrides?.['pasir_pasang'] || 260000;
  const hargaPasirUrug = project.materialPriceOverrides?.['pasir_urug'] || 180000;
  const hargaBatuSplit = project.materialPriceOverrides?.['batu_split'] || 285000;
  const hargaBatuKali = project.materialPriceOverrides?.['batu_kali'] || 250000;
  const hargaBesi12 = project.materialPriceOverrides?.['besi_12mm'] || 118000;
  const hargaBesi10 = project.materialPriceOverrides?.['besi_10mm'] || 82000;
  const hargaBesi8 = project.materialPriceOverrides?.['besi_8mm'] || 53000;
  const hargaBendrat = project.materialPriceOverrides?.['kawat_bendrat'] || 22000;
  const hargaBekisting = project.materialPriceOverrides?.['multiplex_9mm'] || 135000;

  const allItems: AHSPItemAnalysis[] = [];

  // Helper builder
  const createAHSPItem = (
    id: string,
    codeSNI: string,
    name: string,
    divisionId: 'persiapan_tanah' | 'struktur' | 'pasangan_finishing' | 'atap_plafon' | 'me_elektrikal',
    divisionTitle: string,
    unit: string,
    volume: number,
    coefficients: AHSPCoefficient[],
    isApplicable: boolean = true
  ): AHSPItemAnalysis => {
    if (!isApplicable) {
      volume = 0;
    }

    let materialUnitCost = 0;
    let laborUnitCost = 0;

    coefficients.forEach(c => {
      const itemCost = c.coefficient * c.unitPrice;
      c.totalCost = Math.round(itemCost);
      if (c.category === 'bahan') {
        materialUnitCost += isLaborOnly ? 0 : itemCost;
      } else {
        laborUnitCost += itemCost;
      }
    });

    const unitPrice = Math.round(materialUnitCost + laborUnitCost);
    const totalMaterialCost = Math.round(materialUnitCost * volume);
    const totalLaborCost = Math.round(laborUnitCost * volume);
    const totalCost = totalMaterialCost + totalLaborCost;

    // Client unit price includes allocated overhead + profit
    const clientUnitPrice = Math.round(unitPrice * marginMultiplier);
    const clientTotalCost = Math.round(clientUnitPrice * volume);

    const item: AHSPItemAnalysis = {
      id,
      codeSNI,
      name,
      divisionId,
      divisionTitle,
      unit,
      volume: Number(volume.toFixed(2)),
      materialUnitCost: Math.round(materialUnitCost),
      laborUnitCost: Math.round(laborUnitCost),
      unitPrice,
      totalMaterialCost,
      totalLaborCost,
      totalCost,
      clientUnitPrice,
      clientTotalCost,
      coefficients,
    };

    allItems.push(item);
    return item;
  };

  // =========================================================================
  // 1. DIVISI: PEKERJAAN PERSIAPAN & TANAH
  // =========================================================================
  const siteClearingArea = groundArea * 1.25;
  const bouwplankLength = approxPerimeter + 8;
  const excavationDepth = foundationType === 'batu_kali' ? 0.75 : 0.85;
  const excavationVol = approxPerimeter * 0.8 * excavationDepth;
  const backfillVol = excavationVol * 0.45;
  const sandBeddingVol = (approxPerimeter * 0.8 * 0.1) + (groundArea * 0.05);

  const itemPembersihan = createAHSPItem(
    'ahsp_pembersihan_lahan',
    'A.2.2.1.9',
    'Pembersihan & Perataan Lahan Lokasi Bangunan',
    'persiapan_tanah',
    'Pekerjaan Persiapan & Tanah',
    'm²',
    siteClearingArea,
    [
      { code: 'L.01', name: 'Pekerja Lapangan', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.01, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  const itemBouwplank = createAHSPItem(
    'ahsp_bouwplank',
    'A.2.2.1.4',
    'Pengukuran & Pemasangan Bouwplank / Papan Duga',
    'persiapan_tanah',
    'Pekerjaan Persiapan & Tanah',
    'm¹',
    bouwplankLength,
    [
      { code: 'M.01', name: 'Kayu Usuk 5/7 Meranti/Campur', category: 'bahan', unit: 'm³', coefficient: 0.012, unitPrice: 2800000, totalCost: 0 },
      { code: 'M.02', name: 'Paku 2" - 3"', category: 'bahan', unit: 'kg', coefficient: 0.02, unitPrice: 20000, totalCost: 0 },
      { code: 'M.03', name: 'Kayu Papan Terentang 2/20', category: 'bahan', unit: 'm³', coefficient: 0.007, unitPrice: 2400000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Kayu', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahTukangKayu, totalCost: 0 },
      { code: 'L.03', name: 'Kepala Tukang', category: 'upah', unit: 'OH', coefficient: 0.01, unitPrice: upahKepalaTukang, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.005, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  const itemGalian = createAHSPItem(
    'ahsp_galian_tanah',
    'A.2.3.1.1',
    'Galian Tanah Pondasi (Kedalaman s/d 1 Meter)',
    'persiapan_tanah',
    'Pekerjaan Persiapan & Tanah',
    'm³',
    excavationVol,
    [
      { code: 'L.01', name: 'Pekerja Galian', category: 'upah', unit: 'OH', coefficient: 0.75, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.025, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  const itemUruganKembali = createAHSPItem(
    'ahsp_urugan_kembali',
    'A.2.3.1.9',
    'Urugan Tanah Kembali Sisi Pondasi & Pemadatan',
    'persiapan_tanah',
    'Pekerjaan Persiapan & Tanah',
    'm³',
    backfillVol,
    [
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.30, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.01, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  const itemUrugPasir = createAHSPItem(
    'ahsp_urug_pasir',
    'A.2.3.1.11',
    'Urugan Pasir Alas Pondasi & Bawah Lantai Dasar',
    'persiapan_tanah',
    'Pekerjaan Persiapan & Tanah',
    'm³',
    sandBeddingVol,
    [
      { code: 'M.04', name: 'Pasir Urug Bersih', category: 'bahan', unit: 'm³', coefficient: 1.20, unitPrice: hargaPasirUrug, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.30, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.01, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // =========================================================================
  // 2. DIVISI: PEKERJAAN STRUKTUR
  // =========================================================================
  const batuKaliVol = foundationType === 'batu_kali'
    ? approxPerimeter * 0.65 * 0.75
    : approxPerimeter * 0.55 * 0.65;
  const sloofLength = approxPerimeter + (calc.totalWallArea / (wallHeight || 3.5) * 0.45);
  const sloofVol = sloofLength * 0.15 * 0.20;
  const columnCount = Math.round((approxPerimeter * 1.5) / 3.2);
  const columnTotalLength = columnCount * wallHeight * floors;
  const columnVol = floors === 2 ? columnTotalLength * (0.15 * 0.20) : columnTotalLength * (0.12 * 0.15);
  const ringbalkLength = sloofLength * floors;
  const ringbalkVol = ringbalkLength * 0.12 * 0.18;
  const slabVol = floors === 2 ? secondFloorArea * 0.12 : 0;
  const stairsVol = floors === 2 ? 2.5 : 0;

  // Pondasi Batu Kali AHSP
  createAHSPItem(
    'ahsp_pondasi_batu_kali',
    'A.3.2.1.2',
    'Pasangan Pondasi Batu Kali Belah (Campuran 1 Pc : 4 Ps)',
    'struktur',
    'Pekerjaan Struktur',
    'm³',
    batuKaliVol,
    [
      { code: 'M.05', name: 'Batu Kali / Batu Belah', category: 'bahan', unit: 'm³', coefficient: 1.20, unitPrice: hargaBatuKali, totalCost: 0 },
      { code: 'M.06', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 136 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.07', name: 'Pasir Pasang', category: 'bahan', unit: 'm³', coefficient: 0.52, unitPrice: hargaPasirPasang, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 1.50, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Batu', category: 'upah', unit: 'OH', coefficient: 0.75, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.03', name: 'Kepala Tukang', category: 'upah', unit: 'OH', coefficient: 0.075, unitPrice: upahKepalaTukang, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.075, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Pondasi Tapak (Footplat / Cakar Ayam / Strauss Pile)
  if (calc.foundationPoints > 0) {
    const isCakarAyam = foundationType === 'cakar_ayam';
    const isStrauss = foundationType === 'strauss_pile';
    const rebarKg = isCakarAyam ? 38 : (isStrauss ? 42 : 28);
    const concreteM3 = calc.foundationConcreteVol / calc.foundationPoints;

    createAHSPItem(
      'ahsp_pondasi_tapak',
      'A.4.1.1.PF',
      isCakarAyam 
        ? `Pondasi Cakar Ayam Tulangan Dobel Grid (${calc.foundationPoints} Titik)` 
        : isStrauss 
        ? `Pondasi Strauss Pile Tiang Bor Manual Ø25cm + Pile Cap (${calc.foundationPoints} Titik)`
        : `Pondasi Footplat / Telapak Plat Beton Bertulang (${calc.foundationPoints} Titik)`,
      'struktur',
      'Pekerjaan Struktur',
      'titik',
      calc.foundationPoints,
      [
        { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: (concreteM3 * 340) / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
        { code: 'M.09', name: 'Pasir Beton', category: 'bahan', unit: 'm³', coefficient: concreteM3 * 0.54, unitPrice: hargaPasirBeton, totalCost: 0 },
        { code: 'M.10', name: 'Batu Split 2/3', category: 'bahan', unit: 'm³', coefficient: concreteM3 * 0.82, unitPrice: hargaBatuSplit, totalCost: 0 },
        { code: 'M.11', name: 'Besi Beton D12 Ulir/Polos', category: 'bahan', unit: 'kg', coefficient: rebarKg, unitPrice: hargaBesi12 / 10.6, totalCost: 0 },
        { code: 'M.12', name: 'Kawat Bendrat', category: 'bahan', unit: 'kg', coefficient: rebarKg * 0.015, unitPrice: hargaBendrat, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja + Pembesian + Pengecoran', category: 'upah', unit: 'OH', coefficient: 0.95, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Besi & Batu', category: 'upah', unit: 'OH', coefficient: 0.65, unitPrice: upahTukangBatu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahMandor, totalCost: 0 },
      ]
    );
  }

  // Sloof Beton Bertulang 15x20 AHSP
  createAHSPItem(
    'ahsp_sloof_beton',
    'A.4.1.1.28',
    'Beton Bertulang Sloof 15x20 cm (Pembesian 4D10 + Beugel D8-150)',
    'struktur',
    'Pekerjaan Struktur',
    'm³',
    sloofVol,
    [
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 340 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.09', name: 'Pasir Beton', category: 'bahan', unit: 'm³', coefficient: 0.54, unitPrice: hargaPasirBeton, totalCost: 0 },
      { code: 'M.10', name: 'Batu Split 2/3', category: 'bahan', unit: 'm³', coefficient: 0.82, unitPrice: hargaBatuSplit, totalCost: 0 },
      { code: 'M.13', name: 'Besi Beton Polos/Ulir (D10 & D8)', category: 'bahan', unit: 'kg', coefficient: 125, unitPrice: 12500, totalCost: 0 },
      { code: 'M.12', name: 'Kawat Bendrat', category: 'bahan', unit: 'kg', coefficient: 1.8, unitPrice: hargaBendrat, totalCost: 0 },
      { code: 'M.14', name: 'Multipleks & Kayu Bekisting', category: 'bahan', unit: 'm²', coefficient: 2.5, unitPrice: 65000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Cor & Rakit', category: 'upah', unit: 'OH', coefficient: 2.2, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Batu/Besi', category: 'upah', unit: 'OH', coefficient: 1.1, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Kolom Struktur Bertulang AHSP
  createAHSPItem(
    'ahsp_kolom_beton',
    'A.4.1.1.29',
    `Beton Bertulang Kolom Praktis & Kolom Utama (Tinggi ${wallHeight}m)`,
    'struktur',
    'Pekerjaan Struktur',
    'm³',
    columnVol,
    [
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 340 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.09', name: 'Pasir Beton', category: 'bahan', unit: 'm³', coefficient: 0.54, unitPrice: hargaPasirBeton, totalCost: 0 },
      { code: 'M.10', name: 'Batu Split 2/3', category: 'bahan', unit: 'm³', coefficient: 0.82, unitPrice: hargaBatuSplit, totalCost: 0 },
      { code: 'M.15', name: 'Besi Beton (D12/D10 Tulangan + D8 Beugel)', category: 'bahan', unit: 'kg', coefficient: 135, unitPrice: 13200, totalCost: 0 },
      { code: 'M.12', name: 'Kawat Bendrat', category: 'bahan', unit: 'kg', coefficient: 2.0, unitPrice: hargaBendrat, totalCost: 0 },
      { code: 'M.14', name: 'Bekisting Kolom Multipleks 9mm', category: 'bahan', unit: 'm²', coefficient: 3.2, unitPrice: 75000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Lapangan', category: 'upah', unit: 'OH', coefficient: 2.4, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Batu/Besi/Kayu', category: 'upah', unit: 'OH', coefficient: 1.2, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.15, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Balok / Ringbalk Beton Bertulang AHSP
  createAHSPItem(
    'ahsp_ringbalk_beton',
    'A.4.1.1.30',
    'Beton Bertulang Balok & Ringbalk Dinding Atas',
    'struktur',
    'Pekerjaan Struktur',
    'm³',
    ringbalkVol,
    [
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 340 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.09', name: 'Pasir Beton', category: 'bahan', unit: 'm³', coefficient: 0.54, unitPrice: hargaPasirBeton, totalCost: 0 },
      { code: 'M.10', name: 'Batu Split 2/3', category: 'bahan', unit: 'm³', coefficient: 0.82, unitPrice: hargaBatuSplit, totalCost: 0 },
      { code: 'M.13', name: 'Besi Beton D10 & D8', category: 'bahan', unit: 'kg', coefficient: 120, unitPrice: 12500, totalCost: 0 },
      { code: 'M.14', name: 'Bekisting Balok Gantungan', category: 'bahan', unit: 'm²', coefficient: 2.8, unitPrice: 70000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Cor', category: 'upah', unit: 'OH', coefficient: 2.2, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Batu/Besi', category: 'upah', unit: 'OH', coefficient: 1.1, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Plat Lantai 2 Beton Bertulang (Jika 2 Lantai)
  if (floors === 2) {
    createAHSPItem(
      'ahsp_plat_lantai2',
      'A.4.1.1.33',
      'Plat Dak Cor Lantai 2 (Floordeck Bondek 0.75mm + Wiremesh M8 + Cor Tebal 12cm)',
      'struktur',
      'Pekerjaan Struktur',
      'm²',
      secondFloorArea,
      [
        { code: 'M.16', name: 'Plat Bondek Floordeck 0.75mm Galvanis', category: 'bahan', unit: 'm²', coefficient: 1.05, unitPrice: 125000, totalCost: 0 },
        { code: 'M.17', name: 'Wiremesh M8 Ulir (Anyaman 15x15cm)', category: 'bahan', unit: 'lembar', coefficient: 1 / 10.5, unitPrice: 560000, totalCost: 0 },
        { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak) Cor K-225`, category: 'bahan', unit: 'sak', coefficient: (0.12 * 340) / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
        { code: 'M.09', name: 'Pasir Beton', category: 'bahan', unit: 'm³', coefficient: 0.12 * 0.54, unitPrice: hargaPasirBeton, totalCost: 0 },
        { code: 'M.10', name: 'Batu Split 2/3', category: 'bahan', unit: 'm³', coefficient: 0.12 * 0.82, unitPrice: hargaBatuSplit, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja Gelar Bondek & Cor', category: 'upah', unit: 'OH', coefficient: 0.35, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Besi & Batu', category: 'upah', unit: 'OH', coefficient: 0.20, unitPrice: upahTukangBatu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.02, unitPrice: upahMandor, totalCost: 0 },
      ]
    );

    // Struktur Tangga Beton Bertulang
    createAHSPItem(
      'ahsp_struktur_tangga',
      'A.4.1.1.34',
      'Struktur Tangga Beton Bertulang Plat & Bordes (Lantai 1 ke Lantai 2)',
      'struktur',
      'Pekerjaan Struktur',
      'm³',
      stairsVol,
      [
        { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 340 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
        { code: 'M.09', name: 'Pasir Beton', category: 'bahan', unit: 'm³', coefficient: 0.54, unitPrice: hargaPasirBeton, totalCost: 0 },
        { code: 'M.10', name: 'Batu Split 2/3', category: 'bahan', unit: 'm³', coefficient: 0.82, unitPrice: hargaBatuSplit, totalCost: 0 },
        { code: 'M.15', name: 'Besi Beton D12 & D10 Tangga Anyam Dobel', category: 'bahan', unit: 'kg', coefficient: 140, unitPrice: 13500, totalCost: 0 },
        { code: 'M.14', name: 'Bekisting Anak Tangga & Bordes', category: 'bahan', unit: 'm²', coefficient: 3.5, unitPrice: 85000, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja Rakit Tangga & Cor', category: 'upah', unit: 'OH', coefficient: 3.0, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Kayu/Besi/Batu Tangga', category: 'upah', unit: 'OH', coefficient: 1.8, unitPrice: upahTukangBatu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.18, unitPrice: upahMandor, totalCost: 0 },
      ]
    );
  }

  // =========================================================================
  // 3. DIVISI: PEKERJAAN PASANGAN & FINISHING
  // =========================================================================
  const isHebel = project.wallType === 'hebel';

  if (isHebel) {
    createAHSPItem(
      'ahsp_pasang_hebel',
      'A.4.4.1.20',
      'Pasangan Dinding Bata Ringan Hebel (Tebal 10cm + Mortar Thinbed)',
      'pasangan_finishing',
      'Pekerjaan Pasangan & Finishing',
      'm²',
      netWallArea,
      [
        { code: 'M.18', name: 'Bata Ringan Hebel Tebal 10cm', category: 'bahan', unit: 'm³', coefficient: 0.105, unitPrice: 650000, totalCost: 0 },
        { code: 'M.19', name: 'Semen Mortar Thinbed Perekat Hebel', category: 'bahan', unit: 'sak', coefficient: 0.11, unitPrice: 85000, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Pasang Bata', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahTukangBatu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.006, unitPrice: upahMandor, totalCost: 0 },
      ]
    );
  } else {
    createAHSPItem(
      'ahsp_pasang_bata_merah',
      'A.4.4.1.1',
      'Pasangan Dinding Bata Merah Press (Spesi Campuran 1 Pc : 4 Ps)',
      'pasangan_finishing',
      'Pekerjaan Pasangan & Finishing',
      'm²',
      netWallArea,
      [
        { code: 'M.20', name: 'Bata Merah Bakar / Press', category: 'bahan', unit: 'buah', coefficient: 72, unitPrice: 850, totalCost: 0 },
        { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 8.8 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
        { code: 'M.07', name: 'Pasir Pasang Ayak', category: 'bahan', unit: 'm³', coefficient: 0.042, unitPrice: hargaPasirPasang, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.18, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Batu', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahTukangBatu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.01, unitPrice: upahMandor, totalCost: 0 },
      ]
    );
  }

  // Plesteran Dinding 2 Sisi Tebal 15mm
  createAHSPItem(
    'ahsp_plesteran_dinding',
    'A.4.4.2.4',
    'Plesteran Dinding Bata 2 Sisi (Campuran 1 Pc : 4 Ps, Tebal 15mm)',
    'pasangan_finishing',
    'Pekerjaan Pasangan & Finishing',
    'm²',
    plasterSkimcoatArea,
    [
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 6.5 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.07', name: 'Pasir Pasang Plester', category: 'bahan', unit: 'm³', coefficient: 0.022, unitPrice: hargaPasirPasang, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Ayak & Adukan', category: 'upah', unit: 'OH', coefficient: 0.15, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Plester', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.008, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Acian Dinding Halus Semen 50kg Skimcoat Anti-Retak
  createAHSPItem(
    'ahsp_acian_dinding',
    'A.4.4.2.27',
    `Acian Halus Dinding Interior & Eksterior (Semen Acian ${acianBagWeight}kg Anti Retak Rambut)`,
    'pasangan_finishing',
    'Pekerjaan Pasangan & Finishing',
    'm²',
    plasterSkimcoatArea,
    [
      { code: 'M.21', name: `Semen Acian Instan / Skimcoat (${acianBagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 1 / (acianBagWeight === 50 ? 21 : 17), unitPrice: acianBagWeight === 50 ? 98000 : 82000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Acian Halus', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.005, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Pasangan Lantai Granit Tile 60x60
  const mainFloorArea = floorTileArea * 0.82;
  createAHSPItem(
    'ahsp_granit_lantai',
    'A.4.4.3.35',
    'Pasangan Lantai Granit Tile Homogeneous 60x60 cm Polished (Ruang Utama)',
    'pasangan_finishing',
    'Pekerjaan Pasangan & Finishing',
    'm²',
    mainFloorArea,
    [
      { code: 'M.22', name: 'Granit Tile 60x60 cm Polished (Isi 4 pcs/dus)', category: 'bahan', unit: 'm²', coefficient: 1.05, unitPrice: 165000 / 1.44, totalCost: 0 },
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak) Perekat Dasar`, category: 'bahan', unit: 'sak', coefficient: 5.5 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.07', name: 'Pasir Pasang Ayak Halus', category: 'bahan', unit: 'm³', coefficient: 0.025, unitPrice: hargaPasirPasang, totalCost: 0 },
      { code: 'M.23', name: 'Semen Nat Grout Granit Warna Senada', category: 'bahan', unit: 'kg', coefficient: 0.25, unitPrice: 16000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.22, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Pasang Granit', category: 'upah', unit: 'OH', coefficient: 0.15, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.015, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Pasangan Keramik Kamar Mandi (Lantai Kasar & Dinding)
  const kmFloorWallArea = floorTileArea * 0.18 + (calc.bathroomCount * 14);
  createAHSPItem(
    'ahsp_keramik_km',
    'A.4.4.3.40',
    `Pasangan Keramik Lantai & Dinding Kamar Mandi (${calc.bathroomCount} Kamar Mandi)`,
    'pasangan_finishing',
    'Pekerjaan Pasangan & Finishing',
    'm²',
    kmFloorWallArea,
    [
      { code: 'M.24', name: 'Keramik KM Anti-Slip 25x25 & Dinding 25x40', category: 'bahan', unit: 'm²', coefficient: 1.05, unitPrice: 85000, totalCost: 0 },
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak)`, category: 'bahan', unit: 'sak', coefficient: 6.0 / bagWeight, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'M.07', name: 'Pasir Pasang', category: 'bahan', unit: 'm³', coefficient: 0.02, unitPrice: hargaPasirPasang, totalCost: 0 },
      { code: 'M.23', name: 'Semen Nat Anti-Jamur Kamar Mandi', category: 'bahan', unit: 'kg', coefficient: 0.35, unitPrice: 18000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.20, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Pasang Keramik', category: 'upah', unit: 'OH', coefficient: 0.14, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.012, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Pengecatan Dinding Interior 2 Lapis
  const interiorWallArea = netWallArea * 1.35;
  createAHSPItem(
    'ahsp_cat_interior',
    'A.4.7.1.10',
    'Pengecatan Tembok Interior (1 Lapis Cat Dasar Alkali + 2 Lapis Finish)',
    'pasangan_finishing',
    'Pekerjaan Pasangan & Finishing',
    'm²',
    interiorWallArea,
    [
      { code: 'M.25', name: 'Cat Dasar Alkali Sealer Interior', category: 'bahan', unit: 'kg', coefficient: 0.10, unitPrice: 26000, totalCost: 0 },
      { code: 'M.26', name: 'Cat Tembok Interior (Pail 20kg)', category: 'bahan', unit: 'kg', coefficient: 0.24, unitPrice: 32500, totalCost: 0 },
      { code: 'M.27', name: 'Kuas, Rol & Amplas Tembok', category: 'bahan', unit: 'set', coefficient: 0.02, unitPrice: 45000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Pengamplasan', category: 'upah', unit: 'OH', coefficient: 0.05, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.05', name: 'Tukang Cat Interior', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahTukangCat, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.004, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Pengecatan Dinding Eksterior Weathershield
  const exteriorWallArea = netWallArea * 0.65;
  createAHSPItem(
    'ahsp_cat_eksterior',
    'A.4.7.1.11',
    'Pengecatan Tembok Eksterior (Cat Dasar Weatherproof + 2 Lapis Weathershield)',
    'pasangan_finishing',
    'Pekerjaan Pasangan & Finishing',
    'm²',
    exteriorWallArea,
    [
      { code: 'M.28', name: 'Cat Dasar Alkali Tahan Cuaca Luar', category: 'bahan', unit: 'kg', coefficient: 0.12, unitPrice: 32000, totalCost: 0 },
      { code: 'M.29', name: 'Cat Eksterior Weathershield Anti-Jamur & Lumut', category: 'bahan', unit: 'kg', coefficient: 0.28, unitPrice: 72500, totalCost: 0 },
      { code: 'M.27', name: 'Rol Cat Eksterior & Tangga Kerja', category: 'bahan', unit: 'set', coefficient: 0.03, unitPrice: 50000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.06, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.05', name: 'Tukang Cat Eksterior', category: 'upah', unit: 'OH', coefficient: 0.09, unitPrice: upahTukangCat, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.005, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // =========================================================================
  // 4. DIVISI: PEKERJAAN ATAP & PLAFON
  // =========================================================================
  const lisplangLength = (approxPerimeter * 1.1);

  // Rangka Kuda-kuda Baja Ringan Canal C75
  createAHSPItem(
    'ahsp_rangka_baja_ringan',
    'A.4.2.1.20',
    'Rangka Kuda-kuda & Usuk Baja Ringan Canal C75 (Tebal 0.75mm + Reng 0.45mm)',
    'atap_plafon',
    'Pekerjaan Atap & Plafon',
    'm²',
    roofArea,
    [
      { code: 'M.30', name: 'Profil C75.75 Baja Ringan (SNI)', category: 'bahan', unit: 'batang', coefficient: 1 / 1.5, unitPrice: 88000, totalCost: 0 },
      { code: 'M.31', name: 'Reng Baja Ringan R32.45', category: 'bahan', unit: 'batang', coefficient: 0.75, unitPrice: 42000, totalCost: 0 },
      { code: 'M.32', name: 'Sekrup Roofing & Dynabolt Angkur', category: 'bahan', unit: 'buah', coefficient: 18, unitPrice: 850, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Baja Ringan Tersertifikasi', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahTukangBesi, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.008, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Penutup Atap Genteng Metal Pasir + Nok Bubungan + Lisplang GRC
  createAHSPItem(
    'ahsp_penutup_genteng',
    'A.4.5.2.15',
    'Penutup Atap Genteng Metal Pasir Minimalis + Nok Bubungan + Lisplang GRC',
    'atap_plafon',
    'Pekerjaan Atap & Plafon',
    'm²',
    roofArea,
    [
      { code: 'M.33', name: 'Genteng Metal Pasir 2x4 Pola', category: 'bahan', unit: 'lembar', coefficient: 1.62, unitPrice: 42000, totalCost: 0 },
      { code: 'M.34', name: 'Nok / Bubungan Metal Pasir', category: 'bahan', unit: 'lembar', coefficient: (project.houseLength * 1.2) / roofArea, unitPrice: 32000, totalCost: 0 },
      { code: 'M.35', name: 'Lisplang GRC Profil Tepi Cucuran', category: 'bahan', unit: 'lembar', coefficient: (lisplangLength / 2.4) / roofArea, unitPrice: 65000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Angkat Genteng', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Pasang Genteng', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.006, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Rangka Hollow Plafon Galvanis 40x40 & 20x40
  createAHSPItem(
    'ahsp_rangka_hollow_plafon',
    'A.4.5.1.18',
    'Rangka Plafon Besi Hollow Galvanis (Induk 40x40 & Pembagi 20x40 Modul 60x60)',
    'atap_plafon',
    'Pekerjaan Atap & Plafon',
    'm²',
    ceilingArea,
    [
      { code: 'M.36', name: 'Hollow Galvanis 4x4 (Panjang 4m)', category: 'bahan', unit: 'batang', coefficient: 0.35, unitPrice: 32000, totalCost: 0 },
      { code: 'M.37', name: 'Hollow Galvanis 2x4 (Panjang 4m)', category: 'bahan', unit: 'batang', coefficient: 0.80, unitPrice: 24000, totalCost: 0 },
      { code: 'M.38', name: 'Gantungan Kawat & Rod Pisher', category: 'bahan', unit: 'set', coefficient: 1.0, unitPrice: 8500, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Rangka Plafon', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahTukangKayu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.006, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Penutup Plafon Gypsum vs PVC
  if (ceilingType === 'pvc') {
    createAHSPItem(
      'ahsp_plafon_pvc',
      'A.4.5.1.PVC',
      'Penutup Plafon PVC Tebal 8mm (Tahan Air, Anti Rayap & Bebas Cat) + List Profil',
      'atap_plafon',
      'Pekerjaan Atap & Plafon',
      'm²',
      ceilingArea,
      [
        { code: 'M.39', name: 'Panel Plafon PVC 8mm Motif (Lebar 20cm x 4m)', category: 'bahan', unit: 'lembar', coefficient: 1.08 / 0.8, unitPrice: 34000, totalCost: 0 },
        { code: 'M.40', name: 'List Profil Sudut PVC Dinding', category: 'bahan', unit: 'm¹', coefficient: 0.38, unitPrice: 7000, totalCost: 0 },
        { code: 'M.41', name: 'Sekrup Khusus & Klip Pengunci PVC', category: 'bahan', unit: 'dus', coefficient: 1 / 40, unitPrice: 42000, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Pasang Plafon PVC Rapi', category: 'upah', unit: 'OH', coefficient: 0.14, unitPrice: upahTukangKayu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.008, unitPrice: upahMandor, totalCost: 0 },
      ]
    );
  } else {
    createAHSPItem(
      'ahsp_plafon_gypsum',
      'A.4.5.1.7',
      'Penutup Plafon Papan Gypsum Tebal 9mm + Jointing Cornice Compound Rapi',
      'atap_plafon',
      'Pekerjaan Atap & Plafon',
      'm²',
      ceilingArea,
      [
        { code: 'M.42', name: 'Gypsum Board Tebal 9mm (1.2m x 2.4m)', category: 'bahan', unit: 'lembar', coefficient: 1.08 / 2.88, unitPrice: 72000, totalCost: 0 },
        { code: 'M.43', name: 'Compound Cornice & Kasa Paper Tape', category: 'bahan', unit: 'kg', coefficient: 0.45, unitPrice: 3750, totalCost: 0 },
        { code: 'M.44', name: 'Sekrup Gypsum 1 1/4"', category: 'bahan', unit: 'buah', coefficient: 22, unitPrice: 250, totalCost: 0 },
        { code: 'L.01', name: 'Pekerja', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahPekerja, totalCost: 0 },
        { code: 'L.02', name: 'Tukang Pasang & Dempul Gypsum', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahTukangKayu, totalCost: 0 },
        { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.006, unitPrice: upahMandor, totalCost: 0 },
      ]
    );
  }

  // =========================================================================
  // 5. DIVISI: PEKERJAAN ME (MEKANIKAL & ELEKTRIKAL)
  // =========================================================================
  const electricalPoints = Math.max(12, Math.round(totalBuildingArea / 4.2));
  const lightPoints = Math.round(electricalPoints * 0.60);
  const powerOutletPoints = Math.round(electricalPoints * 0.25);
  const switchPoints = Math.round(electricalPoints * 0.15);
  const cleanWaterPipeM = Math.ceil(approxPerimeter * 0.6 * 4); // meter lari
  const wasteWaterPipeM = Math.ceil(approxPerimeter * 0.75 * 4); // meter lari

  // Titik Lampu Penerangan
  createAHSPItem(
    'ahsp_titik_lampu',
    'E.1.1.1.1',
    'Instalasi Titik Lampu Penerangan (Kabel NYM 2x1.5mm + Pipa Konduit + Fiting & Bohlam LED)',
    'me_elektrikal',
    'Pekerjaan ME (Mekanikal & Elektrikal)',
    'titik',
    lightPoints,
    [
      { code: 'M.45', name: 'Kabel NYM 2x1.5 mm (SNI)', category: 'bahan', unit: 'meter', coefficient: 9.5, unitPrice: 6500, totalCost: 0 },
      { code: 'M.46', name: 'Pipa Konduit Listrik PVC 20mm & T-Dos', category: 'bahan', unit: 'btg', coefficient: 1.2, unitPrice: 9500, totalCost: 0 },
      { code: 'M.47', name: 'Fiting Plafon & Lampu LED Hemat Energi', category: 'bahan', unit: 'set', coefficient: 1.0, unitPrice: 28000, totalCost: 0 },
      { code: 'L.06', name: 'Tukang Listrik', category: 'upah', unit: 'OH', coefficient: 0.35, unitPrice: upahTukangListrik, totalCost: 0 },
      { code: 'L.01', name: 'Pembantu Tukang', category: 'upah', unit: 'OH', coefficient: 0.20, unitPrice: upahPekerja, totalCost: 0 },
    ]
  );

  // Stop Kontak Dinding
  createAHSPItem(
    'ahsp_stopkontak',
    'E.1.1.1.2',
    'Instalasi Titik Stop Kontak Dinding (Kabel NYM 3x2.5mm Berarde + Inbow Doos Broco)',
    'me_elektrikal',
    'Pekerjaan ME (Mekanikal & Elektrikal)',
    'titik',
    powerOutletPoints,
    [
      { code: 'M.48', name: 'Kabel NYM 3x2.5 mm Berarde Grounding', category: 'bahan', unit: 'meter', coefficient: 9.0, unitPrice: 11500, totalCost: 0 },
      { code: 'M.49', name: 'Stop Kontak Tanam Broco/Panasonic + Inbow Doos', category: 'bahan', unit: 'set', coefficient: 1.0, unitPrice: 32000, totalCost: 0 },
      { code: 'M.46', name: 'Pipa Konduit Pelindung Kabel', category: 'bahan', unit: 'btg', coefficient: 1.1, unitPrice: 9500, totalCost: 0 },
      { code: 'L.06', name: 'Tukang Listrik', category: 'upah', unit: 'OH', coefficient: 0.35, unitPrice: upahTukangListrik, totalCost: 0 },
      { code: 'L.01', name: 'Pembantu Tukang', category: 'upah', unit: 'OH', coefficient: 0.15, unitPrice: upahPekerja, totalCost: 0 },
    ]
  );

  // Sakelar Dinding Tunggal / Ganda
  createAHSPItem(
    'ahsp_sakelar',
    'E.1.1.1.3',
    'Instalasi Sakelar Tunggal & Ganda Dinding (Broco / Panasonic)',
    'me_elektrikal',
    'Pekerjaan ME (Mekanikal & Elektrikal)',
    'titik',
    switchPoints,
    [
      { code: 'M.45', name: 'Kabel NYM 2x1.5 mm', category: 'bahan', unit: 'meter', coefficient: 6.5, unitPrice: 6500, totalCost: 0 },
      { code: 'M.50', name: 'Sakelar Dinding Ganda/Tunggal + Inbow Doos', category: 'bahan', unit: 'set', coefficient: 1.0, unitPrice: 26000, totalCost: 0 },
      { code: 'L.06', name: 'Tukang Listrik', category: 'upah', unit: 'OH', coefficient: 0.25, unitPrice: upahTukangListrik, totalCost: 0 },
      { code: 'L.01', name: 'Pembantu Tukang', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahPekerja, totalCost: 0 },
    ]
  );

  // Instalasi Pipa Air Bersih PVC AW 1/2" & 3/4"
  createAHSPItem(
    'ahsp_pipa_air_bersih',
    'M.2.1.1.5',
    'Instalasi Pemipaan Air Bersih Dingin Pipa PVC AW 1/2" & 3/4" (Toren ke Kran)',
    'me_elektrikal',
    'Pekerjaan ME (Mekanikal & Elektrikal)',
    'm¹',
    cleanWaterPipeM,
    [
      { code: 'M.51', name: 'Pipa PVC Tipe AW 1/2" / 3/4"', category: 'bahan', unit: 'meter', coefficient: 1.15, unitPrice: 46000 / 4, totalCost: 0 },
      { code: 'M.52', name: 'Fitting Keni, Tee, Lem Pipa & Seal Tape', category: 'bahan', unit: 'set', coefficient: 0.25, unitPrice: 15000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Bobok Dinding & Tanam', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Pipa / Plambing', category: 'upah', unit: 'OH', coefficient: 0.08, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.005, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Instalasi Pipa Air Kotor & Pembuangan PVC D 3" & 4"
  createAHSPItem(
    'ahsp_pipa_air_kotor',
    'M.2.1.1.8',
    'Instalasi Saluran Air Kotor / Air Bekas Mandi (Pipa PVC 3") & Limbah WC (Pipa PVC AW 4")',
    'me_elektrikal',
    'Pekerjaan ME (Mekanikal & Elektrikal)',
    'm¹',
    wasteWaterPipeM,
    [
      { code: 'M.53', name: 'Pipa PVC AW 3" & 4" Saluran Buang', category: 'bahan', unit: 'meter', coefficient: 1.15, unitPrice: 165000 / 4, totalCost: 0 },
      { code: 'M.54', name: 'Keni, P-Trap, Lem PVC & Klem Pipa', category: 'bahan', unit: 'set', coefficient: 0.20, unitPrice: 24000, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Gali & Pasang Pipa', category: 'upah', unit: 'OH', coefficient: 0.12, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Plambing Sanitasi', category: 'upah', unit: 'OH', coefficient: 0.10, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.008, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Septictank Biofil & Sumur Resapan
  createAHSPItem(
    'ahsp_septictank_resapan',
    'M.2.2.1.1',
    `Pemasangan Tangki Biofil Ramah Lingkungan (Anti Kuras) + Bak Kontrol & Sumur Resapan`,
    'me_elektrikal',
    'Pekerjaan ME (Mekanikal & Elektrikal)',
    'unit',
    1,
    [
      { code: 'M.55', name: 'Tangki Biofil Kapasitas 500-800 Liter Lengkap Media Bakteri', category: 'bahan', unit: 'unit', coefficient: 1.0, unitPrice: 1850000, totalCost: 0 },
      { code: 'M.05', name: 'Batu Kali & Buis Beton Resapan Ø80cm', category: 'bahan', unit: 'set', coefficient: 1.0, unitPrice: 450000, totalCost: 0 },
      { code: 'M.08', name: `Semen Portland (${bagWeight}kg/sak) & Pasir Spesi`, category: 'bahan', unit: 'sak', coefficient: 3.0, unitPrice: hargaSemen50kg, totalCost: 0 },
      { code: 'L.01', name: 'Pekerja Galian Tanah Dalam', category: 'upah', unit: 'OH', coefficient: 3.5, unitPrice: upahPekerja, totalCost: 0 },
      { code: 'L.02', name: 'Tukang Setting Tanki & Pipa', category: 'upah', unit: 'OH', coefficient: 2.0, unitPrice: upahTukangBatu, totalCost: 0 },
      { code: 'L.04', name: 'Mandor', category: 'upah', unit: 'OH', coefficient: 0.25, unitPrice: upahMandor, totalCost: 0 },
    ]
  );

  // Group into 5 official divisions
  const divisionMeta: Record<string, { title: string; subtitle: string; order: number }> = {
    persiapan_tanah: {
      title: 'Pekerjaan Persiapan & Tanah',
      subtitle: 'Pembersihan lahan, bowplank, galian tanah, urugan kembali & urug pasir alas',
      order: 1,
    },
    struktur: {
      title: 'Pekerjaan Struktur',
      subtitle: 'Pondasi, sloof, kolom praktis/utama, ringbalk, plat lantai 2 & struktur tangga',
      order: 2,
    },
    pasangan_finishing: {
      title: 'Pekerjaan Pasangan & Finishing',
      subtitle: `Pasangan bata, plesteran, acian semen ${acianBagWeight}kg, keramik/granit & cat dinding`,
      order: 3,
    },
    atap_plafon: {
      title: 'Pekerjaan Atap & Plafon',
      subtitle: `Rangka baja ringan C75, genteng pasir, dan ${ceilingType === 'pvc' ? 'plafon PVC tahan air' : 'plafon gypsum 9mm'}`,
      order: 4,
    },
    me_elektrikal: {
      title: 'Pekerjaan ME (Mekanikal & Elektrikal)',
      subtitle: 'Titik lampu, stopkontak, sakelar, instalasi pipa air bersih, air kotor & biofil',
      order: 5,
    },
  };

  const divisions: AHSPDivision[] = Object.keys(divisionMeta).map(divKey => {
    const meta = divisionMeta[divKey];
    const items = allItems.filter(i => i.divisionId === divKey);
    const totalMaterialCost = items.reduce((sum, i) => sum + i.totalMaterialCost, 0);
    const totalLaborCost = items.reduce((sum, i) => sum + i.totalLaborCost, 0);
    const totalHPP = totalMaterialCost + totalLaborCost;
    const clientTotalCost = items.reduce((sum, i) => sum + i.clientTotalCost, 0);

    return {
      id: divKey as any,
      title: meta.title,
      subtitle: meta.subtitle,
      order: meta.order,
      items,
      totalMaterialCost,
      totalLaborCost,
      totalHPP,
      clientTotalCost,
    };
  });

  return { divisions, allItems };
}
