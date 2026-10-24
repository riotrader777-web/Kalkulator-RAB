/**
 * Types definition for Indonesian House Construction RAB Application
 */

export type FloorType = 1 | 2;

export type WallMaterialType = 'hebel' | 'bata_merah';

export type CeilingMaterialType = 'gypsum' | 'pvc';

export type CementBagWeight = 40 | 50;

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
  
  // Cement bag standard (User requested 50kg)
  cementBagWeight: CementBagWeight;

  // Dimensions
  floors: FloorType;
  houseLength: number; // m
  houseWidth: number; // m
  groundFloorArea: number; // m²
  secondFloorArea: number; // m² (if 2 floors)
  wallHeight: number; // m (e.g. 3.0 to 4.5 m)
  wallType: WallMaterialType;
  ceilingType?: CeilingMaterialType; // 'gypsum' | 'pvc' (default 'gypsum')

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
  
  // Cement bag stats
  cementBagWeight: CementBagWeight;
  totalCementBags: number;

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
}
