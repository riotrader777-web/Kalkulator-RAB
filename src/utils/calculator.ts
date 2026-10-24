/**
 * Construction Cost Calculation Engine (Standar AHSP / SNI & Realita Lapangan)
 * Mendukung semen 50kg per sak & sinkronisasi otomatis denah ruangan arsitektur.
 */

import { DEFAULT_MATERIALS, DEFAULT_LABOR_RATES } from '../data/defaultCatalog';
import { 
  SavedProject, 
  CalculationBreakdown, 
  BoQCategory, 
  PhysicalMaterialRequirement, 
  ScopeOptions,
  ScopeMode,
  PackageComparisonItem
} from '../types/rab';

export function calculateRAB(project: SavedProject): CalculationBreakdown {
  // 1. Resolve Cement Standard (User requested 50kg bags)
  const bagWeight = project.cementBagWeight || 50; // 50 kg per sak
  const cementMaterialId = 'semen_portland_50kg';

  // 2. Resolve Effective Material Prices
  const getMaterialPrice = (id: string): number => {
    // If querying old 40kg cement, map to 50kg
    const targetId = id === 'semen_portland_40kg' ? cementMaterialId : id;
    if (project.materialPriceOverrides && project.materialPriceOverrides[targetId] !== undefined) {
      return project.materialPriceOverrides[targetId];
    }
    const item = DEFAULT_MATERIALS.find(m => m.id === targetId) || DEFAULT_MATERIALS.find(m => m.id === id);
    return item ? item.defaultPrice : 0;
  };

  // 3. Resolve Effective Labor Rates
  const getLaborRate = (id: string): number => {
    if (project.laborRateOverrides && project.laborRateOverrides[id] !== undefined) {
      return project.laborRateOverrides[id];
    }
    const item = DEFAULT_LABOR_RATES.find(l => l.id === id);
    return item ? item.defaultRate : 0;
  };

  // 4. Geometry & Floor Plan Derivations
  const floors = project.floors || 1;
  const isFloorPlanSyncActive = Boolean(
    project.useFloorPlanSync && 
    project.floorPlanRooms && 
    project.floorPlanRooms.length > 0
  );

  let groundArea: number;
  let secondFloorArea: number;
  let customDividerWallLength = 0;
  let customBathroomCount = 0;
  let customDoorWindowCount = 0;

  if (isFloorPlanSyncActive && project.floorPlanRooms) {
    const f1Rooms = project.floorPlanRooms.filter(r => r.floor === 1);
    const f2Rooms = project.floorPlanRooms.filter(r => r.floor === 2);

    const sumF1 = f1Rooms.reduce((acc, r) => acc + (r.length * r.width), 0);
    const sumF2 = f2Rooms.reduce((acc, r) => acc + (r.length * r.width), 0);

    groundArea = Number((sumF1 > 0 ? sumF1 : project.groundFloorArea).toFixed(1));
    secondFloorArea = floors === 2 ? Number((sumF2 > 0 ? sumF2 : project.secondFloorArea).toFixed(1)) : 0;

    // Calculate internal walls based on individual room borders
    // Shared interior wall formula: sum of perimeters * 0.45 (avoids counting shared partition twice)
    const allRooms = project.floorPlanRooms.filter(r => r.floor <= floors);
    const perimeterSum = allRooms.reduce((acc, r) => acc + 2 * (r.length + r.width), 0);
    customDividerWallLength = perimeterSum * 0.38;

    customBathroomCount = allRooms.filter(r => r.type === 'bathroom').length || (floors === 2 ? 2 : 1);
    customDoorWindowCount = Math.max(4, allRooms.length);
  } else {
    groundArea = project.groundFloorArea > 0 
      ? project.groundFloorArea 
      : (project.houseLength * project.houseWidth);
    
    secondFloorArea = floors === 2 
      ? (project.secondFloorArea > 0 ? project.secondFloorArea : groundArea * 0.9)
      : 0;
  }

  const totalBuildingArea = groundArea + secondFloorArea;
  const wallHeight = project.wallHeight > 0 ? project.wallHeight : 3.5; // meter

  // Perimeter estimation (Exterior walls + interior divider walls)
  const approxPerimeter = 2 * (project.houseLength + project.houseWidth);
  const internalDividerLength = isFloorPlanSyncActive && customDividerWallLength > 0
    ? customDividerWallLength
    : 1.4 * (project.houseLength + project.houseWidth);

  const wallLengthPerFloor = approxPerimeter + internalDividerLength;
  const totalWallLength = wallLengthPerFloor * floors;

  // Total Wall Surface Area
  const grossWallArea = totalWallLength * wallHeight;
  const openingsArea = grossWallArea * 0.12;
  const netWallArea = Math.max(20, grossWallArea - openingsArea);

  // Plaster & Skimcoat Area (2 sisi dinding: dalam & luar)
  const plasterSkimcoatArea = netWallArea * 1.95;

  // Roof Area
  const roofFootprint = floors === 2 ? secondFloorArea : groundArea;
  const roofOverhangArea = (project.houseLength + 1.6) * (project.houseWidth + 1.6);
  const roofPitchMultiplier = 1.22;
  const roofArea = Math.max(roofFootprint * 1.25, roofOverhangArea * roofPitchMultiplier);

  // Ceiling Area (Plafon)
  const ceilingArea = totalBuildingArea * 1.05;

  // Floor Tile Area (Lantai Keramik/Granit)
  const floorTileArea = totalBuildingArea * 0.96;

  // Active Scopes Setup
  let activeScopes: ScopeOptions;
  const mode = project.scopeMode;

  if (mode === 'turnkey' || mode === 'allin_buka_kunci' || mode === 'labor_only' || mode === 'upah_buka_kunci') {
    // Siap huni / buka kunci lengkap (10 bidang pekerjaan)
    activeScopes = {
      pondasi: true,
      struktur: true,
      dinding_aci: true,
      atap: true,
      plafon: true,
      lantai_keramik: true,
      pintu_jendela: true,
      sanitair: true,
      cat_finishing: true,
      listrik: true,
    };
  } else if (mode === 'ngaci_tanpa_plafon' || mode === 'allin_ngaci_tanpa_plafon' || mode === 'upah_ngaci_tanpa_plafon') {
    // 1 & 2: Sampai Ngaci TANPA Plafon (Pondasi, Struktur, Dinding/Aci, Atap)
    activeScopes = {
      pondasi: true,
      struktur: true,
      dinding_aci: true,
      atap: true,
      plafon: false,
      lantai_keramik: false,
      pintu_jendela: false,
      sanitair: false,
      cat_finishing: false,
      listrik: false,
    };
  } else if (mode === 'ngaci_dengan_plafon' || mode === 'allin_ngaci_dengan_plafon' || mode === 'upah_ngaci_dengan_plafon') {
    // 3 & 4: Sampai Ngaci ADA Plafon (Pondasi, Struktur, Dinding/Aci, Atap, Plafon Gypsum)
    activeScopes = {
      pondasi: true,
      struktur: true,
      dinding_aci: true,
      atap: true,
      plafon: true,
      lantai_keramik: false,
      pintu_jendela: false,
      sanitair: false,
      cat_finishing: false,
      listrik: false,
    };
  } else if (mode === 'upah_finish_keramik_cat' || mode === 'allin_finish_keramik_cat') {
    // 5 & 6: Sampai Finish Keramik & Cat (Pondasi, Struktur, Dinding/Aci, Atap, Plafon, Lantai Keramik, Pengecatan)
    activeScopes = {
      pondasi: true,
      struktur: true,
      dinding_aci: true,
      atap: true,
      plafon: true,
      lantai_keramik: true,
      pintu_jendela: false,
      sanitair: false,
      cat_finishing: true,
      listrik: false,
    };
  } else {
    // Mode checklist kustom
    activeScopes = { ...project.customScopes };
  }

  // Tentukan apakah paket ini adalah Borongan UPAH TENAGA SAJA
  // Bila TRUE, material bernilai Rp 0 karena disediakan pemilik bangunan
  const isLaborOnly = 
    mode === 'labor_only' ||
    mode === 'upah_buka_kunci' ||
    mode === 'upah_ngaci_tanpa_plafon' ||
    mode === 'upah_ngaci_dengan_plafon' ||
    mode === 'upah_finish_keramik_cat';

  // Physical Quantities Accumulator
  const materialsMap: Record<string, { qty: number; unit: string; name: string; category: any; notes: string }> = {};
  const addMaterialQty = (id: string, qty: number, notes = '') => {
    if (qty <= 0) return;
    const targetId = id === 'semen_portland_40kg' ? cementMaterialId : id;
    const item = DEFAULT_MATERIALS.find(m => m.id === targetId) || DEFAULT_MATERIALS.find(m => m.id === id);
    if (!item) return;
    if (!materialsMap[targetId]) {
      materialsMap[targetId] = {
        qty: 0,
        unit: item.unit,
        name: item.name,
        category: item.category,
        notes: notes || item.description || '',
      };
    }
    materialsMap[targetId].qty += qty;
  };

  // Tracking total cement bags (50kg)
  let totalPortlandCementBags = 0;

  // ----------------------------------------------------
  // DETAILED BOQ CATEGORIES COMPUTATION
  // ----------------------------------------------------
  const categories: BoQCategory[] = [];

  // 1. PONDASI & PEKERJAAN TANAH
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    const excavationVol = approxPerimeter * 0.8 * 0.8;
    const sandUrugVol = approxPerimeter * 0.8 * 0.1 + (groundArea * 0.05);
    const batuKaliVol = approxPerimeter * 0.6 * 0.7;

    const footplatePoints = floors === 2 ? Math.max(12, Math.round(groundArea / 5.5)) : 0;
    const footplateConcreteVol = footplatePoints * (0.8 * 0.8 * 0.25);

    if (activeScopes.pondasi) {
      addMaterialQty('pasir_urug', sandUrugVol, 'Urugan pasir dasar pondasi & bawah lantai');
      addMaterialQty('batu_kali', batuKaliVol, 'Pasangan pondasi batu kali lajur');
      
      // Spesi mortar pondasi batu kali (1 semen : 4 pasir)
      // Standar AHSP: ~136 kg semen per m³ pondasi batu kali => sak 50kg: 136/50 = 2.72 sak (vs 3.4 sak 40kg)
      const semenPondasiSak = Math.ceil(batuKaliVol * (136 / bagWeight));
      const pasirPondasiM3 = batuKaliVol * 0.45;
      addMaterialQty(cementMaterialId, semenPondasiSak, `Semen ${bagWeight}kg campuran spesi pondasi batu kali`);
      addMaterialQty('pasir_pasang', pasirPondasiM3, 'Pasir spesi pondasi');
      totalPortlandCementBags += semenPondasiSak;

      if (floors === 2) {
        // Cakar ayam: Besi 12mm & 10mm + Cor
        const besiFootplateBatang = footplatePoints * 3.5;
        const bendratFootplateKg = footplatePoints * 0.75;
        const splitFootplateM3 = footplateConcreteVol * 0.82;
        const pasirBetonFootplateM3 = footplateConcreteVol * 0.54;
        // Cor K-225 mutu footplate: ~340 kg semen / m³ => 340 / 50 = 6.8 sak 50kg
        const semenFootplateSak = Math.ceil(footplateConcreteVol * (340 / bagWeight));

        addMaterialQty('besi_12mm', besiFootplateBatang, 'Tulangan tapak pondasi cakar ayam');
        addMaterialQty('kawat_bendrat', bendratFootplateKg, 'Pengikat tulangan cakar ayam');
        addMaterialQty('batu_split', splitFootplateM3, 'Cor beton mutu tapak cakar ayam');
        addMaterialQty('pasir_beton', pasirBetonFootplateM3, 'Pasir cor cakar ayam');
        addMaterialQty(cementMaterialId, semenFootplateSak, `Semen ${bagWeight}kg cor tapak cakar ayam`);
        totalPortlandCementBags += semenFootplateSak;
      }

      const batuKaliCost = isLaborOnly ? 0 : batuKaliVol * getMaterialPrice('batu_kali');
      const pasirUrugCost = isLaborOnly ? 0 : sandUrugVol * getMaterialPrice('pasir_urug');
      const upahPondasi = (excavationVol * 95000) + (batuKaliVol * 185000) + (footplatePoints * 250000);

      matCost += batuKaliCost + pasirUrugCost;
      labCost += upahPondasi;

      subItems.push({
        name: 'Galian Tanah & Pasir Urug Pondasi',
        volume: Number(excavationVol.toFixed(2)),
        unit: 'm³',
        materialCost: pasirUrugCost,
        laborCost: excavationVol * 95000,
        unitPrice: Number(((pasirUrugCost + (excavationVol * 95000)) / (excavationVol || 1)).toFixed(0)),
        totalCost: pasirUrugCost + (excavationVol * 95000),
      });

      subItems.push({
        name: 'Pondasi Batu Belah / Kali Menerus',
        volume: Number(batuKaliVol.toFixed(2)),
        unit: 'm³',
        materialCost: batuKaliCost,
        laborCost: batuKaliVol * 185000,
        unitPrice: Number(((batuKaliCost + (batuKaliVol * 185000)) / (batuKaliVol || 1)).toFixed(0)),
        totalCost: batuKaliCost + (batuKaliVol * 185000),
      });

      if (floors === 2) {
        const cakarAyamCost = isLaborOnly ? 0 : footplatePoints * 420000;
        const cakarAyamLabor = footplatePoints * 250000;
        matCost += cakarAyamCost;
        labCost += cakarAyamLabor;
        subItems.push({
          name: `Pondasi Cakar Ayam / Footplate (80x80cm)`,
          volume: footplatePoints,
          unit: 'titik',
          materialCost: cakarAyamCost,
          laborCost: cakarAyamLabor,
          unitPrice: Number(((cakarAyamCost + cakarAyamLabor) / footplatePoints).toFixed(0)),
          totalCost: cakarAyamCost + cakarAyamLabor,
        });
      }
    }

    categories.push({
      id: 'pondasi',
      title: 'Pekerjaan Pondasi & Galian Tanah',
      included: activeScopes.pondasi,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 2. STRUKTUR BETON BERTULANG
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.struktur) {
      const sloofLength = wallLengthPerFloor;
      const sloofVol = sloofLength * 0.15 * 0.20;

      const columnCount = Math.round(totalWallLength / 3.2);
      const columnTotalLength = columnCount * wallHeight;
      const columnVol = floors === 2 
        ? columnTotalLength * (0.15 * 0.20)
        : columnTotalLength * (0.12 * 0.15);

      const ringbalkLength = wallLengthPerFloor * floors;
      const ringbalkVol = ringbalkLength * 0.12 * 0.18;

      const slabVol = floors === 2 ? secondFloorArea * 0.12 : 0;
      const stairsVol = floors === 2 ? 2.5 : 0;

      const totalConcreteVol = sloofVol + columnVol + ringbalkVol + slabVol + stairsVol;

      const besi12Batang = floors === 2 
        ? Math.round(columnCount * 3.5 + (ringbalkLength / 3)) 
        : 0;

      const besi10Batang = Math.round((sloofLength * 4 / 11) + (ringbalkLength * 4 / 11) + (floors === 1 ? columnCount * 2.8 : 0));

      const totalLinearMeters = sloofLength + columnTotalLength + ringbalkLength;
      const besi8Batang = Math.round((totalLinearMeters / 0.15 * 0.55) / 11.5);
      const kawatBendratKg = Math.max(10, Math.round((besi12Batang + besi10Batang + besi8Batang) * 0.28));

      // Cor Beton K-225: ~340 kg semen / m³ => Sak 50kg: 340 / 50 = 6.8 sak per m³
      const semenCorSak = Math.ceil(totalConcreteVol * (340 / bagWeight));
      const pasirCorM3 = Number((totalConcreteVol * 0.54).toFixed(1));
      const splitCorM3 = Number((totalConcreteVol * 0.82).toFixed(1));

      totalPortlandCementBags += semenCorSak;

      const bondekM2 = floors === 2 ? Number((secondFloorArea * 1.05).toFixed(1)) : 0;
      const wiremeshLembar = floors === 2 ? Math.ceil(secondFloorArea / 10.5) : 0;
      const bekistingLembar = Math.max(12, Math.round((totalLinearMeters * 0.4) / 2.88));

      if (besi12Batang > 0) addMaterialQty('besi_12mm', besi12Batang, 'Tulangan utama kolom & balok lantai');
      addMaterialQty('besi_10mm', besi10Batang, 'Tulangan utama sloof & ringbalk beton');
      addMaterialQty('besi_8mm', besi8Batang, 'Besi sengkang/beugel struktur beton');
      addMaterialQty('kawat_bendrat', kawatBendratKg, 'Kawat ikat rangkaian tulangan');
      addMaterialQty(cementMaterialId, semenCorSak, `Semen ${bagWeight}kg cor sloof, kolom & balok`);
      addMaterialQty('pasir_beton', pasirCorM3, 'Pasir cor beton bertulang');
      addMaterialQty('batu_split', splitCorM3, 'Batu split koral cor');
      addMaterialQty('multiplex_9mm', bekistingLembar, 'Kayu & papan bekisting cetakan cor');

      if (floors === 2) {
        addMaterialQty('bondek_cor', bondekM2, 'Plat lantai floordeck bondek cor dak');
        addMaterialQty('wiremesh_m8', wiremeshLembar, 'Besi anyam wiremesh M8 dak lantai 2');
      }

      const concreteMatCost = isLaborOnly ? 0 : 
        (besi12Batang * getMaterialPrice('besi_12mm')) +
        (besi10Batang * getMaterialPrice('besi_10mm')) +
        (besi8Batang * getMaterialPrice('besi_8mm')) +
        (kawatBendratKg * getMaterialPrice('kawat_bendrat')) +
        (semenCorSak * getMaterialPrice(cementMaterialId)) +
        (pasirCorM3 * getMaterialPrice('pasir_beton')) +
        (splitCorM3 * getMaterialPrice('batu_split')) +
        (bekistingLembar * getMaterialPrice('multiplex_9mm'));

      const slabBondekMatCost = isLaborOnly ? 0 :
        (bondekM2 * getMaterialPrice('bondek_cor')) +
        (wiremeshLembar * getMaterialPrice('wiremesh_m8'));

      const concreteLaborCost = totalConcreteVol * 450000;

      matCost += concreteMatCost + slabBondekMatCost;
      labCost += concreteLaborCost;

      subItems.push({
        name: `Sloof & Ringbalk Beton Bertulang`,
        volume: Number((sloofVol + ringbalkVol).toFixed(2)),
        unit: 'm³',
        materialCost: isLaborOnly ? 0 : Math.round(concreteMatCost * 0.45),
        laborCost: Math.round((sloofVol + ringbalkVol) * 450000),
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : Math.round(concreteMatCost * 0.45)) + Math.round((sloofVol + ringbalkVol) * 450000),
      });

      subItems.push({
        name: `Kolom Struktur Bertulang (Tinggi ${wallHeight}m)`,
        volume: Number(columnVol.toFixed(2)),
        unit: 'm³',
        materialCost: isLaborOnly ? 0 : Math.round(concreteMatCost * 0.55),
        laborCost: Math.round(columnVol * 450000),
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : Math.round(concreteMatCost * 0.55)) + Math.round(columnVol * 450000),
      });

      if (floors === 2) {
        const slabTotal = slabBondekMatCost + Math.round(slabVol * 450000);
        subItems.push({
          name: `Plat Dak Cor Lantai 2 (Bondek + Wiremesh M8 + Cor 12cm)`,
          volume: Number(secondFloorArea.toFixed(1)),
          unit: 'm²',
          materialCost: slabBondekMatCost,
          laborCost: Math.round(slabVol * 450000),
          unitPrice: Number((slabTotal / (secondFloorArea || 1)).toFixed(0)),
          totalCost: slabTotal,
        });
      }
    }

    categories.push({
      id: 'struktur',
      title: 'Pekerjaan Struktur Beton Bertulang',
      included: activeScopes.struktur,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 3. DINDING, PLESTERAN & ACIAN
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.dinding_aci) {
      if (project.wallType === 'hebel') {
        const hebelVol = Number((netWallArea / 9.8).toFixed(1));
        const mortarThinbedSak = Math.ceil(hebelVol * 1.05);

        addMaterialQty('bata_ringan_hebel', hebelVol, `Pasangan dinding hebel (${Math.round(hebelVol * 83)} pcs bata)`);
        addMaterialQty('semen_mortar_hebel', mortarThinbedSak, 'Semen perekat mortar thinbed');

        // Plesteran: ~6.2 kg semen portland / m² plesteran => Sak 50kg: 6.2/50 = 0.124 sak/m²
        const semenPlesterSak = Math.ceil(plasterSkimcoatArea * (6.2 / bagWeight));
        const pasirPlesterM3 = Number((plasterSkimcoatArea * 0.022).toFixed(1));
        const semenAcianSak = Math.ceil(plasterSkimcoatArea / 17);

        totalPortlandCementBags += semenPlesterSak;

        addMaterialQty(cementMaterialId, semenPlesterSak, `Semen ${bagWeight}kg plesteran dinding 2 sisi`);
        addMaterialQty('pasir_pasang', pasirPlesterM3, 'Pasir pasang halus plesteran dinding');
        addMaterialQty('semen_acian_instant', semenAcianSak, 'Semen acian instan skimcoat anti retak');

        const hebelMat = isLaborOnly ? 0 : 
          (hebelVol * getMaterialPrice('bata_ringan_hebel')) + 
          (mortarThinbedSak * getMaterialPrice('semen_mortar_hebel'));
        
        const plesterAciMat = isLaborOnly ? 0 :
          (semenPlesterSak * getMaterialPrice(cementMaterialId)) +
          (pasirPlesterM3 * getMaterialPrice('pasir_pasang')) +
          (semenAcianSak * getMaterialPrice('semen_acian_instant'));

        const upahPasangDinding = netWallArea * 35000;
        const upahPlesterAci = netWallArea * 45000;

        matCost += hebelMat + plesterAciMat;
        labCost += upahPasangDinding + upahPlesterAci;

        subItems.push({
          name: `Pasangan Dinding Bata Ringan Hebel (Tinggi ${wallHeight}m)`,
          volume: Number(netWallArea.toFixed(1)),
          unit: 'm²',
          materialCost: hebelMat,
          laborCost: upahPasangDinding,
          unitPrice: Number(((hebelMat + upahPasangDinding) / netWallArea).toFixed(0)),
          totalCost: hebelMat + upahPasangDinding,
        });

        subItems.push({
          name: `Plesteran & Acian Halus 2 Sisi (Dalam & Luar)`,
          volume: Number(plasterSkimcoatArea.toFixed(1)),
          unit: 'm²',
          materialCost: plesterAciMat,
          laborCost: upahPlesterAci,
          unitPrice: Number(((plesterAciMat + upahPlesterAci) / (plasterSkimcoatArea || 1)).toFixed(0)),
          totalCost: plesterAciMat + upahPlesterAci,
        });
      } else {
        // Bata Merah Bakar
        const bataMerahPcs = Math.round(netWallArea * 72);
        // Semen bata merah: ~8.8 kg per m² => Sak 50kg: 8.8/50 = 0.176 sak/m²
        const semenBataSak = Math.ceil(netWallArea * (8.8 / bagWeight));
        const pasirBataM3 = Number((netWallArea * 0.042).toFixed(1));

        totalPortlandCementBags += semenBataSak;

        addMaterialQty('bata_merah_press', bataMerahPcs, 'Bata merah press/bakar dinding');
        addMaterialQty(cementMaterialId, semenBataSak, `Semen ${bagWeight}kg spesi adukan bata merah`);
        addMaterialQty('pasir_pasang', pasirBataM3, 'Pasir pasang adukan bata merah');

        const semenPlesterSak = Math.ceil(plasterSkimcoatArea * (8.0 / bagWeight));
        const pasirPlesterM3 = Number((plasterSkimcoatArea * 0.026).toFixed(1));
        const semenAcianSak = Math.ceil(plasterSkimcoatArea / 16);

        totalPortlandCementBags += semenPlesterSak;

        addMaterialQty(cementMaterialId, semenPlesterSak, `Semen ${bagWeight}kg plesteran dinding bata merah`);
        addMaterialQty('pasir_pasang', pasirPlesterM3, 'Pasir plesteran halus dinding');
        addMaterialQty('semen_acian_instant', semenAcianSak, 'Semen acian instan skimcoat');

        const bataMat = isLaborOnly ? 0 : 
          (bataMerahPcs * getMaterialPrice('bata_merah_press')) +
          (semenBataSak * getMaterialPrice(cementMaterialId)) +
          (pasirBataM3 * getMaterialPrice('pasir_pasang'));

        const plesterAciMat = isLaborOnly ? 0 :
          (semenPlesterSak * getMaterialPrice(cementMaterialId)) +
          (pasirPlesterM3 * getMaterialPrice('pasir_pasang')) +
          (semenAcianSak * getMaterialPrice('semen_acian_instant'));

        const upahPasangBata = netWallArea * 40000;
        const upahPlesterAci = netWallArea * 48000;

        matCost += bataMat + plesterAciMat;
        labCost += upahPasangBata + upahPlesterAci;

        subItems.push({
          name: `Pasangan Dinding Bata Merah Press (Tinggi ${wallHeight}m)`,
          volume: Number(netWallArea.toFixed(1)),
          unit: 'm²',
          materialCost: bataMat,
          laborCost: upahPasangBata,
          unitPrice: Number(((bataMat + upahPasangBata) / netWallArea).toFixed(0)),
          totalCost: bataMat + upahPasangBata,
        });

        subItems.push({
          name: `Plesteran Tebal & Acian Halus 2 Sisi`,
          volume: Number(plasterSkimcoatArea.toFixed(1)),
          unit: 'm²',
          materialCost: plesterAciMat,
          laborCost: upahPlesterAci,
          unitPrice: Number(((plesterAciMat + upahPlesterAci) / (plasterSkimcoatArea || 1)).toFixed(0)),
          totalCost: plesterAciMat + upahPlesterAci,
        });
      }
    }

    categories.push({
      id: 'dinding_aci',
      title: 'Pekerjaan Pasangan Dinding, Plesteran & Acian',
      included: activeScopes.dinding_aci,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 4. ATAP & RANGKA BAJA RINGAN
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.atap) {
      const bajaKanalBatang = Math.ceil(roofArea / 1.5);
      const rengBatang = Math.ceil(roofArea * 0.75);
      const gentengMetalLembar = Math.ceil(roofArea * 1.62);
      const nokLembar = Math.ceil(project.houseLength * 1.2);
      const lisplangLembar = Math.ceil((2 * (project.houseLength + project.houseWidth) * 1.1) / 2.4);

      addMaterialQty('baja_ringan_kanal_c', bajaKanalBatang, 'Kuda-kuda & gording rangka atap C75');
      addMaterialQty('reng_baja_ringan', rengBatang, 'Reng baja ringan penumpu genteng');
      addMaterialQty('genteng_metal_pasir', gentengMetalLembar, 'Penutup genteng metal pasir minimalis');
      addMaterialQty('bubungan_nok_genteng', nokLembar, 'Nok bubungan atas atap genteng');
      addMaterialQty('lisplang_grc', lisplangLembar, 'Lisplang GRC tepi cucuran atap');

      const roofMat = isLaborOnly ? 0 :
        (bajaKanalBatang * getMaterialPrice('baja_ringan_kanal_c')) +
        (rengBatang * getMaterialPrice('reng_baja_ringan')) +
        (gentengMetalLembar * getMaterialPrice('genteng_metal_pasir')) +
        (nokLembar * getMaterialPrice('bubungan_nok_genteng')) +
        (lisplangLembar * getMaterialPrice('lisplang_grc'));

      const roofLabor = roofArea * 48000;

      matCost += roofMat;
      labCost += roofLabor;

      subItems.push({
        name: `Rangka Kuda-kuda Baja Ringan Kanal C75 & Reng`,
        volume: Number(roofArea.toFixed(1)),
        unit: 'm²',
        materialCost: isLaborOnly ? 0 : (bajaKanalBatang * getMaterialPrice('baja_ringan_kanal_c')) + (rengBatang * getMaterialPrice('reng_baja_ringan')),
        laborCost: roofArea * 30000,
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : (bajaKanalBatang * getMaterialPrice('baja_ringan_kanal_c')) + (rengBatang * getMaterialPrice('reng_baja_ringan'))) + (roofArea * 30000),
      });

      subItems.push({
        name: `Pasangan Genteng Metal Pasir + Nok Bubungan + Lisplang`,
        volume: Number(roofArea.toFixed(1)),
        unit: 'm²',
        materialCost: isLaborOnly ? 0 : (gentengMetalLembar * getMaterialPrice('genteng_metal_pasir')) + (nokLembar * getMaterialPrice('bubungan_nok_genteng')) + (lisplangLembar * getMaterialPrice('lisplang_grc')),
        laborCost: roofArea * 18000,
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : (gentengMetalLembar * getMaterialPrice('genteng_metal_pasir')) + (nokLembar * getMaterialPrice('bubungan_nok_genteng')) + (lisplangLembar * getMaterialPrice('lisplang_grc'))) + (roofArea * 18000),
      });
    }

    categories.push({
      id: 'atap',
      title: 'Pekerjaan Rangka Atap Baja Ringan & Genteng',
      included: activeScopes.atap,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 5. PLAFON (GYPSUM vs PVC) & RANGKA HOLLOW
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;
    const ceilingType = project.ceilingType || 'gypsum';

    if (activeScopes.plafon) {
      const hollow2x4Batang = Math.ceil(ceilingArea * 0.8);
      const hollow4x4Batang = Math.ceil(ceilingArea * 0.35);

      addMaterialQty('hollow_galvanis_2x4', hollow2x4Batang, 'Rangka hollow pembagi plafon');
      addMaterialQty('hollow_galvanis_4x4', hollow4x4Batang, 'Rangka hollow induk gantungan plafon');

      const hollowMatCost = isLaborOnly ? 0 :
        (hollow2x4Batang * getMaterialPrice('hollow_galvanis_2x4')) +
        (hollow4x4Batang * getMaterialPrice('hollow_galvanis_4x4'));

      if (ceilingType === 'pvc') {
        // PERHITUNGAN PLAFON PVC:
        // Standar panel PVC: lebar 20 cm x panjang 4 m = 0.8 m² per lembar
        // Estimasi waste potongan sudut/ruang: +8%
        const pvcLembar = Math.ceil((ceilingArea * 1.08) / 0.8);
        // List profil PVC keliling dinding: estimasi keliling dinding/ruangan
        const listBatang = Math.ceil((approxPerimeter * 1.1) / 4);
        const sekrupDus = Math.ceil(ceilingArea / 40);

        addMaterialQty('plafon_pvc_panel', pvcLembar, 'Panel plafon PVC tebal 8mm tahan air & anti rayap');
        addMaterialQty('list_pvc_profil', listBatang, 'List profil sudut dinding plafon PVC (4m)');
        addMaterialQty('sekrup_pvc', sekrupDus, 'Sekrup khusus plafon PVC & fastener');

        const pvcMat = isLaborOnly ? 0 :
          hollowMatCost +
          (pvcLembar * getMaterialPrice('plafon_pvc_panel')) +
          (listBatang * getMaterialPrice('list_pvc_profil')) +
          (sekrupDus * getMaterialPrice('sekrup_pvc'));

        const pvcLaborRate = getLaborRate('upah_borongan_m2_plafon_pvc') || 55000;
        const plafonLabor = ceilingArea * pvcLaborRate;

        matCost += pvcMat;
        labCost += plafonLabor;

        subItems.push({
          name: `Rangka Plafon Hollow Galvanis (2x4 & 4x4)`,
          volume: Number(ceilingArea.toFixed(1)),
          unit: 'm²',
          materialCost: hollowMatCost,
          laborCost: ceilingArea * 25000,
          unitPrice: 0,
          totalCost: hollowMatCost + (ceilingArea * 25000),
        });

        const panelAndListMat = isLaborOnly ? 0 : 
          (pvcLembar * getMaterialPrice('plafon_pvc_panel')) +
          (listBatang * getMaterialPrice('list_pvc_profil')) +
          (sekrupDus * getMaterialPrice('sekrup_pvc'));
        const panelLabor = ceilingArea * Math.max(25000, pvcLaborRate - 25000);

        subItems.push({
          name: `Pasang Panel Plafon PVC 8mm Tahan Air + List Profil Sudut`,
          volume: Number(ceilingArea.toFixed(1)),
          unit: 'm²',
          materialCost: panelAndListMat,
          laborCost: panelLabor,
          unitPrice: Number(((panelAndListMat + panelLabor) / (ceilingArea || 1)).toFixed(0)),
          totalCost: panelAndListMat + panelLabor,
        });
      } else {
        // PERHITUNGAN PLAFON GYPSUM
        const gypsumLembar = Math.ceil((ceilingArea * 1.08) / 2.88);
        const compoundSak = Math.ceil(ceilingArea / 55);

        addMaterialQty('gypsum_board_9mm', gypsumLembar, 'Papan gypsum 9mm interior');
        addMaterialQty('cornice_compound', compoundSak, 'Dempul compound jointing gypsum');

        const plafonMat = isLaborOnly ? 0 :
          hollowMatCost +
          (gypsumLembar * getMaterialPrice('gypsum_board_9mm')) +
          (compoundSak * getMaterialPrice('cornice_compound'));

        const plafonLabor = ceilingArea * getLaborRate('upah_borongan_m2_plafon');

        matCost += plafonMat;
        labCost += plafonLabor;

        subItems.push({
          name: `Rangka Plafon Hollow Galvanis (2x4 & 4x4)`,
          volume: Number(ceilingArea.toFixed(1)),
          unit: 'm²',
          materialCost: hollowMatCost,
          laborCost: ceilingArea * 25000,
          unitPrice: 0,
          totalCost: hollowMatCost + (ceilingArea * 25000),
        });

        subItems.push({
          name: `Pasang Gypsum 9mm + Jointing Compound Rapi`,
          volume: Number(ceilingArea.toFixed(1)),
          unit: 'm²',
          materialCost: isLaborOnly ? 0 : (gypsumLembar * getMaterialPrice('gypsum_board_9mm')) + (compoundSak * getMaterialPrice('cornice_compound')),
          laborCost: ceilingArea * 25000,
          unitPrice: 0,
          totalCost: (isLaborOnly ? 0 : (gypsumLembar * getMaterialPrice('gypsum_board_9mm')) + (compoundSak * getMaterialPrice('cornice_compound'))) + (ceilingArea * 25000),
        });
      }
    }

    categories.push({
      id: 'plafon',
      title: ceilingType === 'pvc' ? 'Pekerjaan Plafon PVC Rangka Hollow' : 'Pekerjaan Plafon Gypsum Rangka Hollow',
      included: activeScopes.plafon,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 6. LANTAI & KERAMIK / GRANIT
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.lantai_keramik) {
      const granitArea = floorTileArea * 0.82;
      const granitDus = Math.ceil(granitArea / 1.44);
      const kmArea = floorTileArea * 0.18;
      const kmDus = Math.ceil(kmArea / 1.0);

      const rabatBetonM3 = Number((groundArea * 0.05).toFixed(1));
      // Rabat semen: ~260 kg per m³ cor => Sak 50kg: 260/50 = 5.2 sak per m³
      const semenRabatSak = Math.ceil(rabatBetonM3 * (260 / bagWeight));
      const pasirRabatM3 = Number((rabatBetonM3 * 0.7).toFixed(1));

      // Semen perekat keramik: ~5 kg per m² => Sak 50kg: 5/50 = 0.1 sak/m²
      const semenPerekatSak = Math.ceil(floorTileArea * (5.5 / bagWeight));
      const semenNatKg = Math.ceil(floorTileArea * 0.25);

      totalPortlandCementBags += (semenRabatSak + semenPerekatSak);

      addMaterialQty('granit_tile_60x60', granitDus, 'Granit polished 60x60 ruang utama & kamar');
      addMaterialQty('keramik_km_mandi', kmDus, 'Keramik lantai & dinding basah kamar mandi');
      addMaterialQty(cementMaterialId, semenRabatSak + semenPerekatSak, `Semen ${bagWeight}kg cor rabat & perekat keramik`);
      addMaterialQty('pasir_pasang', pasirRabatM3, 'Pasir cor rabat dasar lantai');
      addMaterialQty('semen_nat_keramik', semenNatKg, 'Pengisi nat keramik / tile grout');

      const tileMat = isLaborOnly ? 0 :
        (granitDus * getMaterialPrice('granit_tile_60x60')) +
        (kmDus * getMaterialPrice('keramik_km_mandi')) +
        ((semenRabatSak + semenPerekatSak) * getMaterialPrice(cementMaterialId)) +
        (pasirRabatM3 * getMaterialPrice('pasir_pasang')) +
        (semenNatKg * getMaterialPrice('semen_nat_keramik'));

      const tileLabor = floorTileArea * 48000;

      matCost += tileMat;
      labCost += tileLabor;

      subItems.push({
        name: `Rabat Dasar Lantai Kerja Beton (Tebal 5 cm)`,
        volume: rabatBetonM3,
        unit: 'm³',
        materialCost: isLaborOnly ? 0 : (semenRabatSak * getMaterialPrice(cementMaterialId)) + (pasirRabatM3 * getMaterialPrice('pasir_pasang')),
        laborCost: groundArea * 18000,
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : (semenRabatSak * getMaterialPrice(cementMaterialId)) + (pasirRabatM3 * getMaterialPrice('pasir_pasang'))) + (groundArea * 18000),
      });

      subItems.push({
        name: `Pasang Granit 60x60 Ruang Utama & Keramik KM`,
        volume: Number(floorTileArea.toFixed(1)),
        unit: 'm²',
        materialCost: isLaborOnly ? 0 : (granitDus * getMaterialPrice('granit_tile_60x60')) + (kmDus * getMaterialPrice('keramik_km_mandi')) + (semenPerekatSak * getMaterialPrice(cementMaterialId)) + (semenNatKg * getMaterialPrice('semen_nat_keramik')),
        laborCost: floorTileArea * 30000,
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : (granitDus * getMaterialPrice('granit_tile_60x60')) + (kmDus * getMaterialPrice('keramik_km_mandi')) + (semenPerekatSak * getMaterialPrice(cementMaterialId)) + (semenNatKg * getMaterialPrice('semen_nat_keramik'))) + (floorTileArea * 30000),
      });
    }

    categories.push({
      id: 'lantai_keramik',
      title: 'Pekerjaan Lantai Keramik & Granit',
      included: activeScopes.lantai_keramik,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 7. KUSEN, PINTU, JENDELA
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.pintu_jendela) {
      const doorSetCount = isFloorPlanSyncActive && customDoorWindowCount > 0
        ? customDoorWindowCount
        : Math.max(4, Math.round(totalBuildingArea / 18));

      addMaterialQty('kusen_pintu_jendela', doorSetCount, 'Kusen aluminium 3"/4" + daun pintu & jendela lengkap');

      const doorsMat = isLaborOnly ? 0 : doorSetCount * getMaterialPrice('kusen_pintu_jendela');
      const doorsLabor = doorSetCount * 250000;

      matCost += doorsMat;
      labCost += doorsLabor;

      subItems.push({
        name: `Pemasangan Kusen Aluminium & Daun Pintu/Jendela`,
        volume: doorSetCount,
        unit: 'set',
        materialCost: doorsMat,
        laborCost: doorsLabor,
        unitPrice: Number(((doorsMat + doorsLabor) / doorSetCount).toFixed(0)),
        totalCost: doorsMat + doorsLabor,
      });
    }

    categories.push({
      id: 'pintu_jendela',
      title: 'Pekerjaan Pintu, Jendela & Kusen',
      included: activeScopes.pintu_jendela,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 8. SANITAIR & PLUMBING
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.sanitair) {
      const bathroomCount = isFloorPlanSyncActive && customBathroomCount > 0
        ? customBathroomCount
        : (floors === 2 ? 2 : 1);

      const klosetUnit = bathroomCount;
      const biofilUnit = 1;
      const pipa4Batang = Math.ceil(approxPerimeter * 0.35);
      const pipa3Batang = Math.ceil(approxPerimeter * 0.4);
      const pipaHalfBatang = Math.ceil(approxPerimeter * 0.6);

      addMaterialQty('kloset_duduk', klosetUnit, 'Kloset duduk set lengkap');
      addMaterialQty('septictank_biofil', biofilUnit, 'Biofil septictank ramah lingkungan');
      addMaterialQty('pipa_pvc_4inch', pipa4Batang, 'Pipa limbah tinja WC');
      addMaterialQty('pipa_pvc_3inch', pipa3Batang, 'Pipa air kotor buangan lantai');
      addMaterialQty('pipa_pvc_half_inch', pipaHalfBatang, 'Pipa distribusi air bersih');

      const sanitairMat = isLaborOnly ? 0 :
        (klosetUnit * getMaterialPrice('kloset_duduk')) +
        (biofilUnit * getMaterialPrice('septictank_biofil')) +
        (pipa4Batang * getMaterialPrice('pipa_pvc_4inch')) +
        (pipa3Batang * getMaterialPrice('pipa_pvc_3inch')) +
        (pipaHalfBatang * getMaterialPrice('pipa_pvc_half_inch'));

      const sanitairLabor = (bathroomCount * 750000) + 1200000;

      matCost += sanitairMat;
      labCost += sanitairLabor;

      subItems.push({
        name: `Instalasi Pipa Air Bersih & Kotor (PVC AW)`,
        volume: pipa4Batang + pipa3Batang + pipaHalfBatang,
        unit: 'btg',
        materialCost: isLaborOnly ? 0 : (pipa4Batang * getMaterialPrice('pipa_pvc_4inch')) + (pipa3Batang * getMaterialPrice('pipa_pvc_3inch')) + (pipaHalfBatang * getMaterialPrice('pipa_pvc_half_inch')),
        laborCost: 1200000,
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : (pipa4Batang * getMaterialPrice('pipa_pvc_4inch')) + (pipa3Batang * getMaterialPrice('pipa_pvc_3inch')) + (pipaHalfBatang * getMaterialPrice('pipa_pvc_half_inch'))) + 1200000,
      });

      subItems.push({
        name: `Pemasangan Kloset Duduk (${bathroomCount} Unit) & Biofil`,
        volume: bathroomCount,
        unit: 'unit',
        materialCost: isLaborOnly ? 0 : (klosetUnit * getMaterialPrice('kloset_duduk')) + (biofilUnit * getMaterialPrice('septictank_biofil')),
        laborCost: bathroomCount * 750000,
        unitPrice: 0,
        totalCost: (isLaborOnly ? 0 : (klosetUnit * getMaterialPrice('kloset_duduk')) + (biofilUnit * getMaterialPrice('septictank_biofil'))) + (bathroomCount * 750000),
      });
    }

    categories.push({
      id: 'sanitair',
      title: 'Pekerjaan Sanitasi, Pipa & Biofil',
      included: activeScopes.sanitair,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 9. PENGECATAN & FINISHING
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;
    const ceilingType = project.ceilingType || 'gypsum';

    if (activeScopes.cat_finishing) {
      const interiorArea = netWallArea * 1.35;
      const exteriorArea = netWallArea * 0.65;
      const catInteriorPail = Math.ceil(interiorArea / 140);
      const catEksteriorPail = Math.ceil(exteriorArea / 140);
      const catDasarPail = Math.ceil((interiorArea + exteriorArea) / 200);
      
      // Plafon PVC sudah bermotif & anti air, TIDAK memerlukan cat plafon
      const needsCeilingPaint = activeScopes.plafon && ceilingType === 'gypsum';
      const catPlafonPail = needsCeilingPaint ? Math.ceil(ceilingArea / 140) : 0;

      addMaterialQty('cat_tembok_interior_20kg', catInteriorPail, 'Cat tembok interior 2 lapis');
      addMaterialQty('cat_tembok_eksterior_20kg', catEksteriorPail, 'Cat weathershield luar anti-bocor');
      addMaterialQty('cat_dasar_alkali', catDasarPail, 'Cat dasar alkali sealer');
      if (catPlafonPail > 0) {
        addMaterialQty('cat_plafon_putih', catPlafonPail, 'Cat putih plafon gypsum');
      }

      const paintMat = isLaborOnly ? 0 :
        (catInteriorPail * getMaterialPrice('cat_tembok_interior_20kg')) +
        (catEksteriorPail * getMaterialPrice('cat_tembok_eksterior_20kg')) +
        (catDasarPail * getMaterialPrice('cat_dasar_alkali')) +
        (catPlafonPail * getMaterialPrice('cat_plafon_putih'));

      const paintedCeilingArea = needsCeilingPaint ? ceilingArea : 0;
      const totalPaintedArea = interiorArea + exteriorArea + paintedCeilingArea;
      const paintLabor = totalPaintedArea * 16000;

      matCost += paintMat;
      labCost += paintLabor;

      subItems.push({
        name: needsCeilingPaint 
          ? `Pengecatan Cat Dasar Sealer + Cat Interior, Eksterior & Plafon Gypsum`
          : `Pengecatan Cat Dasar Sealer + Cat Dinding (Plafon PVC Bebas Cat)`,
        volume: Number(totalPaintedArea.toFixed(1)),
        unit: 'm²',
        materialCost: paintMat,
        laborCost: paintLabor,
        unitPrice: Number(((paintMat + paintLabor) / (totalPaintedArea || 1)).toFixed(0)),
        totalCost: paintMat + paintLabor,
      });
    }

    categories.push({
      id: 'cat_finishing',
      title: (project.ceilingType || 'gypsum') === 'pvc' 
        ? 'Pekerjaan Pengecatan Dinding (Plafon PVC Siap Pakai)' 
        : 'Pekerjaan Pengecatan Dinding & Plafon',
      included: activeScopes.cat_finishing,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // 10. INSTALASI LISTRIK
  {
    const subItems = [];
    let matCost = 0;
    let labCost = 0;

    if (activeScopes.listrik) {
      const pointCount = Math.max(12, Math.round(totalBuildingArea / 4.2));
      addMaterialQty('titik_listrik_set', pointCount, 'Instalasi titik lampu, kabel NYM & stop kontak');

      const electricMat = isLaborOnly ? 0 : pointCount * getMaterialPrice('titik_listrik_set');
      const electricLabor = pointCount * 75000;

      matCost += electricMat;
      labCost += electricLabor;

      subItems.push({
        name: `Instalasi Titik Lampu & Stop Kontak (Kabel NYM + Saklar)`,
        volume: pointCount,
        unit: 'titik',
        materialCost: electricMat,
        laborCost: electricLabor,
        unitPrice: Number(((electricMat + electricLabor) / pointCount).toFixed(0)),
        totalCost: electricMat + electricLabor,
      });
    }

    categories.push({
      id: 'listrik',
      title: 'Pekerjaan Instalasi Elektrikal & Lampu',
      included: activeScopes.listrik,
      subItems,
      totalMaterialCost: matCost,
      totalLaborCost: labCost,
      totalCost: matCost + labCost,
    });
  }

  // TOTALS
  let totalMaterialCost = 0;
  let totalLaborCost = 0;

  categories.forEach(cat => {
    if (cat.included) {
      totalMaterialCost += cat.totalMaterialCost;
      totalLaborCost += cat.totalLaborCost;
    }
  });

  const baseCost = totalMaterialCost + totalLaborCost;
  const profitMarginPercent = Math.max(0, project.profitMarginPercent || 0);
  const profitAmount = Math.round(baseCost * (profitMarginPercent / 100));

  const contingencyPercent = Math.max(0, project.contingencyPercent || 0);
  const contingencyAmount = Math.round(baseCost * (contingencyPercent / 100));

  let grandTotal = baseCost + profitAmount + contingencyAmount;
  const benchmarkTotal = Math.round(totalBuildingArea * (project.ratePerM2 || 3500000));
  
  if (project.useManualBenchmark) {
    grandTotal = benchmarkTotal;
  }

  const costPerM2 = totalBuildingArea > 0 ? Math.round(grandTotal / totalBuildingArea) : 0;
  const benchmarkDiff = grandTotal - benchmarkTotal;

  const materialRequirements: PhysicalMaterialRequirement[] = Object.keys(materialsMap).map(id => {
    const item = materialsMap[id];
    const unitPrice = getMaterialPrice(id);
    const total = isLaborOnly ? 0 : Math.round(item.qty * unitPrice);
    return {
      materialId: id,
      name: item.name,
      category: item.category,
      quantity: Number(item.qty.toFixed(item.unit === 'm³' || item.unit === 'm²' ? 2 : 0)),
      unit: item.unit,
      unitPrice,
      totalCost: total,
      notes: item.notes,
    };
  });

  return {
    totalBuildingArea,
    groundArea,
    secondFloorArea,
    wallHeight,
    totalWallArea: Number(netWallArea.toFixed(1)),
    roofArea: Number(roofArea.toFixed(1)),
    ceilingArea: Number(ceilingArea.toFixed(1)),
    ceilingType: project.ceilingType || 'gypsum',
    floorTileArea: Number(floorTileArea.toFixed(1)),
    cementBagWeight: bagWeight,
    totalCementBags: totalPortlandCementBags,
    isSyncedWithFloorPlan: isFloorPlanSyncActive,
    roomCount: project.floorPlanRooms ? project.floorPlanRooms.length : 0,
    bathroomCount: isFloorPlanSyncActive ? customBathroomCount : (floors === 2 ? 2 : 1),
    totalMaterialCost,
    totalLaborCost,
    baseCost,
    profitMarginPercent,
    profitAmount,
    contingencyPercent,
    contingencyAmount,
    grandTotal,
    costPerM2,
    benchmarkTotal,
    benchmarkDiff,
    categories,
    materialRequirements,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 1,
  }).format(num);
}

export function isLaborOnlyScope(mode: ScopeMode): boolean {
  return (
    mode === 'labor_only' ||
    mode === 'upah_buka_kunci' ||
    mode === 'upah_ngaci_tanpa_plafon' ||
    mode === 'upah_ngaci_dengan_plafon' ||
    mode === 'upah_finish_keramik_cat'
  );
}

export function getScopeModeMetadata(mode: ScopeMode): {
  title: string;
  badge: string;
  isLaborOnly: boolean;
  description: string;
  groupTitle: string;
} {
  switch (mode) {
    case 'upah_ngaci_tanpa_plafon':
      return {
        title: 'Borongan Upah Tenaga Saja s/d Ngaci (Tanpa Plafon)',
        badge: 'Upah Tenaga Saja',
        isLaborOnly: true,
        groupTitle: 'Sampai Ngaci (Tanpa Plafon)',
        description: 'Hanya upah tenaga pondasi, struktur, dinding diaci & atap. Tanpa plafon, keramik & cat. Material disediakan pemilik.',
      };
    case 'allin_ngaci_tanpa_plafon':
    case 'ngaci_tanpa_plafon':
      return {
        title: 'Borongan Tenaga + Material s/d Ngaci (Tanpa Plafon)',
        badge: 'Tenaga + Material',
        isLaborOnly: false,
        groupTitle: 'Sampai Ngaci (Tanpa Plafon)',
        description: 'Material dan tenaga lengkap struktur cor, dinding hebel/bata diaci halus dan atap. Tanpa plafon.',
      };
    case 'upah_ngaci_dengan_plafon':
      return {
        title: 'Borongan Upah Tenaga Saja s/d Ngaci (Ada Plafon)',
        badge: 'Upah Tenaga Saja',
        isLaborOnly: true,
        groupTitle: 'Sampai Ngaci + Ada Plafon',
        description: 'Upah tenaga struktur, dinding diaci halus, atap + pasang rangka hollow & gypsum plafon. Tanpa keramik & cat.',
      };
    case 'allin_ngaci_dengan_plafon':
    case 'ngaci_dengan_plafon':
      return {
        title: 'Borongan Tenaga + Material s/d Ngaci (Ada Plafon)',
        badge: 'Tenaga + Material',
        isLaborOnly: false,
        groupTitle: 'Sampai Ngaci + Ada Plafon',
        description: 'Material + tenaga struktur, dinding diaci halus, atap + plafon gypsum interior rapi terpasang.',
      };
    case 'upah_finish_keramik_cat':
      return {
        title: 'Borongan Upah Tenaga Saja s/d Finish Keramik & Cat',
        badge: 'Upah Tenaga Saja',
        isLaborOnly: true,
        groupTitle: 'Sampai Finish Keramik & Cat',
        description: 'Upah tenaga sampai tuntas pasang keramik/granit lantai dan cat seluruh dinding & plafon. Material disediakan pemilik.',
      };
    case 'allin_finish_keramik_cat':
      return {
        title: 'Borongan Tenaga + Material s/d Finish Keramik & Cat',
        badge: 'Tenaga + Material',
        isLaborOnly: false,
        groupTitle: 'Sampai Finish Keramik & Cat',
        description: 'Material + tenaga sampai lantai keramik/granit dan cat 2 lapis rapi. Tanpa kusen pintu, sanitair & instalasi listrik.',
      };
    case 'upah_buka_kunci':
    case 'labor_only':
      return {
        title: 'Borongan Upah Tenaga Saja Buka Kunci (Siap Huni)',
        badge: 'Upah Tenaga Saja',
        isLaborOnly: true,
        groupTitle: 'Buka Kunci (Siap Huni)',
        description: 'Upah jasa tenaga kerja untuk seluruh 10 bidang pekerjaan sampai rumah siap huni. Material disiapkan pemilik.',
      };
    case 'turnkey':
    case 'allin_buka_kunci':
    default:
      if (mode === 'custom') {
        return {
          title: 'Borongan Checklist Kustom',
          badge: 'Kustom',
          isLaborOnly: false,
          groupTitle: 'Paket Kustom',
          description: 'Rincian lingkup pekerjaan dipilih secara spesifik per bidang pekerjaan.',
        };
      }
      return {
        title: 'Borongan Buka Kunci (Tenaga + Material Siap Huni)',
        badge: 'All-In Siap Huni',
        isLaborOnly: false,
        groupTitle: 'Buka Kunci (Siap Huni)',
        description: 'Paket lengkap kontraktor serah terima kunci. Seluruh material dan upah tenaga ditanggung pemborong.',
      };
  }
}

/**
 * Menghitung perbandingan otomatis seluruh paket borongan untuk proyek & dimensi rumah saat ini.
 * Memungkinkan pemborong & pemilik membandingkan hitungan secara instan berdampingan.
 */
export function calculatePackageComparison(project: SavedProject): PackageComparisonItem[] {
  const isPvc = (project.ceilingType || 'gypsum') === 'pvc';
  const ceilingLabel = isPvc ? 'Plafon PVC Tahan Air' : 'Plafon Gypsum';
  const ceilingDetail = isPvc ? 'Plafon PVC 8mm Tahan Air + Hollow Rapi' : 'Plafon Gypsum 9mm + Hollow Rapi';

  const packageDefinitions: Array<{
    id: ScopeMode;
    groupKey: 'ngaci_tanpa_plafon' | 'ngaci_dengan_plafon' | 'finish_keramik_cat' | 'buka_kunci';
    groupTitle: string;
    title: string;
    shortTitle: string;
    type: 'upah_saja' | 'all_in';
    typeBadge: string;
    description: string;
    materialResponsibility: 'owner' | 'contractor';
    includesPlafon: boolean;
    includesKeramik: boolean;
    includesCat: boolean;
    includedScopesList: string[];
    excludedScopesList: string[];
  }> = [
    // GRUP 1: Sampai Ngaci TANPA Plafon
    {
      id: 'upah_ngaci_tanpa_plafon',
      groupKey: 'ngaci_tanpa_plafon',
      groupTitle: '1. Sampai Ngaci (Tanpa Plafon)',
      title: 'Borongan Upah Tenaga Saja s/d Ngaci (Tanpa Plafon)',
      shortTitle: 'Upah Saja s/d Ngaci (Tanpa Plafon)',
      type: 'upah_saja',
      typeBadge: 'Upah Tenaga Saja',
      description: 'Hanya upah tenaga tukang & mandor pondasi, struktur cor, dinding hebel/bata diaci mulus, dan atap. Tanpa plafon. Material dibeli pemilik.',
      materialResponsibility: 'owner',
      includesPlafon: false,
      includesKeramik: false,
      includesCat: false,
      includedScopesList: ['Pondasi & Galian', 'Struktur Beton Bertulang', 'Dinding & Acian Halus 2 Sisi', 'Rangka Atap Baja Ringan & Genteng'],
      excludedScopesList: [ceilingLabel, 'Lantai Keramik', 'Pintu & Kusen', 'Sanitair & Biofil', 'Pengecatan', 'Listrik'],
    },
    {
      id: 'allin_ngaci_tanpa_plafon',
      groupKey: 'ngaci_tanpa_plafon',
      groupTitle: '1. Sampai Ngaci (Tanpa Plafon)',
      title: 'Borongan Tenaga + Material s/d Ngaci (Tanpa Plafon)',
      shortTitle: 'Tenaga + Material s/d Ngaci (Tanpa Plafon)',
      type: 'all_in',
      typeBadge: 'Tenaga + Material',
      description: 'Paket lengkap material dan upah tenaga pondasi, cor struktur, dinding diaci halus dan atap genteng. Belum ada plafon, keramik & cat.',
      materialResponsibility: 'contractor',
      includesPlafon: false,
      includesKeramik: false,
      includesCat: false,
      includedScopesList: ['Pondasi + Material Lengkap', 'Struktur Beton + Besi/Cor', 'Dinding + Semen 50kg/Pasir/Aci', 'Rangka Atap Baja Ringan + Genteng'],
      excludedScopesList: [ceilingLabel, 'Lantai Keramik', 'Pintu & Kusen', 'Sanitair & Biofil', 'Pengecatan', 'Listrik'],
    },

    // GRUP 2: Sampai Ngaci ADA Plafon
    {
      id: 'upah_ngaci_dengan_plafon',
      groupKey: 'ngaci_dengan_plafon',
      groupTitle: '2. Sampai Ngaci + Ada Plafon',
      title: 'Borongan Upah Tenaga Saja s/d Ngaci (Ada Plafon)',
      shortTitle: 'Upah Saja s/d Ngaci (+ Plafon)',
      type: 'upah_saja',
      typeBadge: 'Upah Tenaga Saja',
      description: isPvc 
        ? 'Upah tenaga tukang dari pondasi, struktur, dinding diaci halus, atap, plus pasang rangka hollow & panel plafon PVC tahan air. Material dibeli pemilik.'
        : 'Upah tenaga tukang dari pondasi, struktur, dinding diaci halus, atap, plus pasang rangka hollow & plafon gypsum compound rapi. Material dibeli pemilik.',
      materialResponsibility: 'owner',
      includesPlafon: true,
      includesKeramik: false,
      includesCat: false,
      includedScopesList: ['Pondasi & Galian', 'Struktur Beton Bertulang', 'Dinding & Acian Halus', 'Atap Baja Ringan', `Pasang Rangka & ${ceilingLabel}`],
      excludedScopesList: ['Lantai Keramik', 'Pintu & Kusen', 'Sanitair & Biofil', 'Pengecatan', 'Listrik'],
    },
    {
      id: 'allin_ngaci_dengan_plafon',
      groupKey: 'ngaci_dengan_plafon',
      groupTitle: '2. Sampai Ngaci + Ada Plafon',
      title: 'Borongan Tenaga + Material s/d Ngaci (Ada Plafon)',
      shortTitle: 'Tenaga + Material s/d Ngaci (+ Plafon)',
      type: 'all_in',
      typeBadge: 'Tenaga + Material',
      description: isPvc
        ? 'Material & tenaga struktur, dinding diaci rapi, atap, serta material rangka hollow + panel plafon PVC tahan air 8mm terpasang rapi.'
        : 'Material & tenaga struktur, dinding diaci rapi, atap, serta material rangka hollow + lembar gypsum 9mm terpasang. Siap dicat & dikeramik.',
      materialResponsibility: 'contractor',
      includesPlafon: true,
      includesKeramik: false,
      includesCat: false,
      includedScopesList: ['Pondasi Lengkap', 'Struktur Beton Bertulang', 'Dinding & Acian Halus', 'Atap Baja Ringan & Genteng', ceilingDetail],
      excludedScopesList: ['Lantai Keramik', 'Pintu & Kusen', 'Sanitair & Biofil', 'Pengecatan', 'Listrik'],
    },

    // GRUP 3: Sampai Finish Keramik & Cat
    {
      id: 'upah_finish_keramik_cat',
      groupKey: 'finish_keramik_cat',
      groupTitle: '3. Sampai Finish Keramik & Cat',
      title: 'Borongan Upah Tenaga Saja s/d Finish Keramik & Cat',
      shortTitle: 'Upah Saja s/d Finish Keramik & Cat',
      type: 'upah_saja',
      typeBadge: 'Upah Tenaga Saja',
      description: isPvc
        ? 'Upah tenaga tukang s/d pasang keramik/granit lantai, plafon PVC, dan cat seluruh dinding interior-eksterior. Material disiapkan oleh pemilik.'
        : 'Upah tenaga tukang s/d pasang keramik/granit lantai dan cat seluruh dinding & plafon interior-eksterior. Material disiapkan oleh pemilik.',
      materialResponsibility: 'owner',
      includesPlafon: true,
      includesKeramik: true,
      includesCat: true,
      includedScopesList: ['Pondasi & Galian', 'Struktur Beton', 'Dinding & Acian', 'Atap', ceilingLabel, 'Pasang Keramik / Granit Lantai', isPvc ? 'Pengecatan Dinding (Plafon Bebas Cat)' : 'Pengecatan Dinding & Plafon'],
      excludedScopesList: ['Kusen, Pintu & Jendela', 'Sanitair, Pipa & Biofil', 'Instalasi Elektrikal'],
    },
    {
      id: 'allin_finish_keramik_cat',
      groupKey: 'finish_keramik_cat',
      groupTitle: '3. Sampai Finish Keramik & Cat',
      title: 'Borongan Tenaga + Material s/d Finish Keramik & Cat',
      shortTitle: 'Tenaga + Material s/d Keramik & Cat',
      type: 'all_in',
      typeBadge: 'Tenaga + Material',
      description: 'Material + tenaga sampai lantai keramik/granit 60x60 terpasang dan pengecatan tembok dasar + 2 lapis. Tanpa pintu, kloset & instalasi kabel.',
      materialResponsibility: 'contractor',
      includesPlafon: true,
      includesKeramik: true,
      includesCat: true,
      includedScopesList: ['Pondasi & Struktur', 'Dinding & Acian', 'Atap Baja Ringan', ceilingLabel, 'Granit 60x60 + Rabat Beton', 'Cat Interior & Eksterior'],
      excludedScopesList: ['Kusen, Pintu & Jendela', 'Sanitair, Pipa & Biofil', 'Instalasi Elektrikal'],
    },

    // GRUP 4: Buka Kunci (Siap Huni Lengkap)
    {
      id: 'upah_buka_kunci',
      groupKey: 'buka_kunci',
      groupTitle: '4. Buka Kunci (Siap Huni Lengkap)',
      title: 'Borongan Upah Tenaga Saja Buka Kunci (Siap Huni)',
      shortTitle: 'Upah Saja Buka Kunci',
      type: 'upah_saja',
      typeBadge: 'Upah Tenaga Saja',
      description: 'Jasa tenaga kerja lengkap untuk semua 10 bidang pekerjaan sampai rumah selesai siap pakai. Material seluruhnya disediakan pemilik.',
      materialResponsibility: 'owner',
      includesPlafon: true,
      includesKeramik: true,
      includesCat: true,
      includedScopesList: ['Seluruh Upah 10 Bidang Konstruksi Lengkap Siap Huni'],
      excludedScopesList: [],
    },
    {
      id: 'allin_buka_kunci',
      groupKey: 'buka_kunci',
      groupTitle: '4. Buka Kunci (Siap Huni Lengkap)',
      title: 'Borongan Buka Kunci (Tenaga + Material Siap Huni)',
      shortTitle: 'All-In Buka Kunci (Siap Huni)',
      type: 'all_in',
      typeBadge: 'Tenaga + Material',
      description: 'Paket kontraktor serah terima kunci lengkap. Seluruh material, upah tukang, mandor & manajemen resiko ditanggung pihak pemborong.',
      materialResponsibility: 'contractor',
      includesPlafon: true,
      includesKeramik: true,
      includesCat: true,
      includedScopesList: ['Seluruh Material + Upah 10 Bidang Pekerjaan Lengkap Siap Huni'],
      excludedScopesList: [],
    },
  ];

  return packageDefinitions.map(pkg => {
    // Run calculator on clone with this scope mode and disabled manual benchmark for true BoQ calculation
    const tempProject: SavedProject = {
      ...project,
      scopeMode: pkg.id,
      useManualBenchmark: false,
    };
    const result = calculateRAB(tempProject);

    return {
      id: pkg.id,
      groupKey: pkg.groupKey,
      groupTitle: pkg.groupTitle,
      title: pkg.title,
      shortTitle: pkg.shortTitle,
      type: pkg.type,
      typeBadge: pkg.typeBadge,
      description: pkg.description,
      materialResponsibility: pkg.materialResponsibility,
      includesPlafon: pkg.includesPlafon,
      includesKeramik: pkg.includesKeramik,
      includesCat: pkg.includesCat,
      includedScopesList: pkg.includedScopesList,
      excludedScopesList: pkg.excludedScopesList,
      grandTotal: result.grandTotal,
      costPerM2: result.costPerM2,
      totalMaterialCost: result.totalMaterialCost,
      totalLaborCost: result.totalLaborCost,
      profitAmount: result.profitAmount,
      cementBags: result.totalCementBags,
    };
  });
}
