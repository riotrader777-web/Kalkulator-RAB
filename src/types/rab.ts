/**
 * Types definition for Indonesian House Construction RAB Application
 */

export type FloorType = 1 | 2;

export type WallMaterialType = 'hebel' | 'bata_merah';

export type CeilingMaterialType = 'gypsum' | 'pvc';

export type FoundationType = 'batu_kali' | 'footplat' | 'cakar_ayam' | 'strauss_pile';

export type CementBagWeight = 40 | 50;

export type AcianBagWeight = 40 | 50;

export type ScopeMode = 
  | 'upah_ngaci_tanpa_plafon'   // 1. Borongan Upah Tenaga Saja s/d Ngaci (Tanpa Plafon)
  | 'allin_ngaci_tanpa_plafon'  // 2. Borongan Tenaga + Material s/d Ngaci (Tanpa Plafon)
  | 'upah_ngaci_dengan_plafon' // 3. Borongan Upah Tenaga Saja s/d Ngaci + Ada Plafon
  | 'allin_ngaci_dengan_plafon' // 4. Borongan Tenaga + Material s/d Ngaci + Ada Plafon
  | 'upah_finish_keramik_cat'   // 5. Borongan Upah Tenaga Saja s/d Finish Keramik & Cat
  | 'allin_finish_keramik_cat'  // 6. Borongan Tenaga + Material s/d Finish Keramik & Cat
  | 'allin_buka_kunci'          // 7. Borongan Buka Kunci (Tenaga + Material Siap Huni)
  | 'upah_buka_kunci'           // 8. Borongan Upah Tenaga Saja Buka Kunci
  | 'custom'                    // 9. Checklist Kustom
  // Backward compatibility aliases
  | 'turnkey'
  | 'labor_only'
  | 'ngaci_tanpa_plafon'
  | 'ngaci_dengan_plafon';

export interface PackageComparisonItem {
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
  grandTotal: number;
  costPerM2: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  profitAmount: number;
  cementBags: number;
}

export interface ScopeOptions {
  pondasi: boolean;
  struktur: boolean;
  dinding_aci: boolean;
  atap: boolean;
  plafon: boolean;
  lantai_keramik: boolean;
  pintu_jendela: boolean;
  sanitair: boolean;
  cat_finishing: boolean;
  listrik: boolean;
}

export type MaterialCategory = 
  | 'agregat_semen' 
  | 'dinding' 
  | 'besi_kawat' 
  | 'atap' 
  | 'plafon' 
  | 'lantai' 
  | 'finishing' 
  | 'sanitair_listrik';

export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: string; // m³, sak, kg, batang, dus, lembar, buah
  defaultPrice: number;
  currentPrice: number;
  description?: string;
}

export interface LaborRateItem {
  id: string;
  name: string;
  role: string;
  unit: string; // OH (Orang Hari) / m²
  defaultRate: number;
  currentRate: number;
}

export type RoomType = 
  | 'bedroom' 
  | 'living' 
  | 'bathroom' 
  | 'kitchen' 
  | 'terrace' 
  | 'dining' 
  | 'carport' 
  | 'service' 
  | 'other';

export interface RoomPlanItem {
  id: string;
  name: string;
  floor: 1 | 2;
  length: number; // m
  width: number;  // m
  area: number;   // m²
  type: RoomType;
  color?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  clientName: string;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  
  // Cement bag standard (User requested 50kg for Portland & Acian)
  cementBagWeight: CementBagWeight;
  acianBagWeight?: AcianBagWeight; // Semen acian 50kg vs 40kg (default 50kg)

  // Dimensions
  floors: FloorType;
  houseLength: number; // m
  houseWidth: number; // m
  groundFloorArea: number; // m²
  secondFloorArea: number; // m² (if 2 floors)
  wallHeight: number; // m (e.g. 3.0 to 4.5 m)
  wallType: WallMaterialType;
  ceilingType?: CeilingMaterialType; // 'gypsum' | 'pvc' (default 'gypsum')
  foundationType?: FoundationType; // 'batu_kali' | 'footplat' | 'cakar_ayam' | 'strauss_pile'

  // Floor Plan Rooms & Sync
  useFloorPlanSync: boolean;
  floorPlanRooms: RoomPlanItem[];
  
  // Pricing Strategy
  ratePerM2: number; // Nominal per meter persegi yang bisa diedit (e.g. 3.500.000)
  useManualBenchmark: boolean; // Gunakan tarif per m² atau hitung otomatis dari BoQ
  
  // Scope & Margin
  scopeMode: ScopeMode;
  customScopes: ScopeOptions;
  profitMarginPercent: number; // e.g. 10%
  contingencyPercent: number; // e.g. 3%
  
  // Custom Prices overrides
  materialPriceOverrides: Record<string, number>;
  laborRateOverrides: Record<string, number>;

  // Regional Labor Wage Database & Manual Overrides
  operationalRegionId?: string; // e.g. 'jabodetabek', 'jawa_barat', 'jawa_tengah', 'diy', 'jawa_timur', 'bali', etc.
  customWorkerWages?: Partial<WorkerWageRates>; // Manual input upah tukang & kenek per OH

  // Project Schedule & S-Curve Configuration
  scheduleStartDate?: string; // YYYY-MM-DD
  scheduleDurationWeeks?: number; // Manual override durasi total minggu (optional)
  actualProgressPerWeek?: Record<number, number>; // Progres riil lapangan per minggu (minggu ke-X -> %)
}

export interface WorkerWageRates {
  mandor: number;         // OH (Orang Hari)
  kepalaTukang: number;   // OH
  tukangBatu: number;     // OH
  tukangKayu: number;     // OH
  tukangBesi: number;     // OH
  tukangCat: number;      // OH
  tukangListrik: number;  // OH
  tukangPipa: number;     // OH
  tukangAtap: number;     // OH
  pekerja: number;        // OH (Kenek / Laden)
  boronganM2Full?: number; // Upah borongan m² bangun penuh
  boronganM2Ngaci?: number; // Upah borongan m² s/d ngaci
}

export interface RegionalWageBenchmark {
  id: string;
  name: string;
  province: string;
  tier: string;
  notes: string;
  rates: WorkerWageRates;
}

export interface MilestoneScheduleItem {
  week: number;
  title: string;
  description: string;
  targetPercent: number;
  status: 'upcoming' | 'current' | 'completed';
}

export interface ScheduleWeekData {
  weekNumber: number;
  weekLabel: string;
  startDateFormatted: string;
  endDateFormatted: string;
  plannedWeeklyPercent: number;     // Bobot rencana minggu ini (%)
  plannedCumulativePercent: number; // Bobot rencana kumulatif (%)
  actualWeeklyPercent?: number;     // Progres aktual minggu ini (%)
  actualCumulativePercent?: number; // Progres aktual kumulatif (%)
  divisionWeights: Record<AHSPDivisionId, number>; // Bobot % divisi minggu ini
  milestoneTitle?: string;
}

export interface ProjectScheduleAnalysis {
  totalWeeks: number;
  totalMonths: string;
  estimatedWorkingDays: number;
  startDate: string;
  weeks: ScheduleWeekData[];
  milestones: MilestoneScheduleItem[];
  peakWeekNumber: number;
  averageWeeklyWeight: number;
  criticalPathNotes: string[];
}

export interface PhysicalMaterialRequirement {
  materialId: string;
  name: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  notes?: string;
}

export interface BoQSubItem {
  name: string;
  volume: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  unitPrice: number;
  totalCost: number;
}

export interface BoQCategory {
  id: keyof ScopeOptions;
  title: string;
  included: boolean;
  subItems: BoQSubItem[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number;
}

export interface AHSPCoefficient {
  code: string;
  name: string;
  category: 'upah' | 'bahan';
  unit: string;
  coefficient: number;
  unitPrice: number;
  totalCost: number;
}

export type AHSPDivisionId = 
  | 'persiapan_tanah' 
  | 'struktur' 
  | 'pasangan_finishing' 
  | 'atap_plafon' 
  | 'me_elektrikal';

export interface AHSPItemAnalysis {
  id: string;
  codeSNI: string;
  name: string;
  divisionId: AHSPDivisionId;
  divisionTitle: string;
  unit: string;
  volume: number;
  materialUnitCost: number;
  laborUnitCost: number;
  unitPrice: number; // HPP per satuan
  totalMaterialCost: number;
  totalLaborCost: number;
  totalCost: number; // HPP total
  clientUnitPrice: number; // Harga Satuan Penawaran Klien (termasuk alokasi margin)
  clientTotalCost: number; // Total Penawaran Klien
  coefficients: AHSPCoefficient[];
}

export interface AHSPDivision {
  id: AHSPDivisionId;
  title: string;
  subtitle: string;
  order: number;
  items: AHSPItemAnalysis[];
  totalMaterialCost: number;
  totalLaborCost: number;
  totalHPP: number;
  clientTotalCost: number;
}

export interface CalculationBreakdown {
  totalBuildingArea: number; // m²
  groundArea: number; // m²
  secondFloorArea: number; // m²
  wallHeight: number; // m
  totalWallArea: number; // m²
  roofArea: number; // m²
  ceilingArea: number; // m²
  ceilingType: CeilingMaterialType;
  floorTileArea: number; // m²
  
  // Foundation stats
  foundationType: FoundationType;
  foundationPoints: number;
  foundationConcreteVol: number; // m³ cor tapak
  foundationBesiBatang: number; // batang besi cor tapak
  
  // Cement bag stats
  cementBagWeight: CementBagWeight;
  totalCementBags: number;
  acianBagWeight: AcianBagWeight;
  totalAcianBags: number;

  // Floor plan stats
  isSyncedWithFloorPlan: boolean;
  roomCount: number;
  bathroomCount: number;

  // Costs
  totalMaterialCost: number;
  totalLaborCost: number;
  baseCost: number; // HPP (Modal Riil)
  
  profitMarginPercent: number;
  profitAmount: number;
  contingencyPercent: number;
  contingencyAmount: number;
  
  grandTotal: number;
  costPerM2: number;
  
  // Benchmark comparison
  benchmarkTotal: number;
  benchmarkDiff: number; // grandTotal - benchmarkTotal
  
  // Categories & Details
  categories: BoQCategory[];
  materialRequirements: PhysicalMaterialRequirement[];
  
  // Official AHSP Divisions (5 Standard Indonesian Divisions)
  ahspDivisions?: AHSPDivision[];
  ahspItems?: AHSPItemAnalysis[];

  // Effective Labor Wages used in this calculation
  effectiveWorkerWages?: WorkerWageRates;

  // Project Schedule & S-Curve Analysis
  schedule?: ProjectScheduleAnalysis;
}
