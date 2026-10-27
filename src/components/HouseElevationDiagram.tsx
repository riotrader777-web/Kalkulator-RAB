import React from 'react';
import { SavedProject, CalculationBreakdown } from '../types/rab';

interface HouseElevationDiagramProps {
  project: SavedProject;
  calculation: CalculationBreakdown;
}

export const HouseElevationDiagram: React.FC<HouseElevationDiagramProps> = ({
  project,
  calculation,
}) => {
  const is2Floors = project.floors === 2;
  const wallHeight = project.wallHeight || 3.5;
  const hasCeiling = calculation.categories.find(c => c.id === 'plafon')?.included;
  const hasTiles = calculation.categories.find(c => c.id === 'lantai_keramik')?.included;
  const hasRoof = calculation.categories.find(c => c.id === 'atap')?.included;
  const isHebel = project.wallType === 'hebel';

  // SVG dimensions & scaling
  const svgWidth = 600;
  const svgHeight = is2Floors ? 420 : 340;
  
  // Base coordinates
  const houseX = 140;
  const houseW = 320;
  const groundY = svgHeight - 80;
  
  // Height scale: 1 meter = 45 pixels
  const floorHeightPx = Math.min(130, Math.max(90, wallHeight * 28));
  const floor1Y = groundY - floorHeightPx;
  const slabThickness = 14;
  const floor2Y = is2Floors ? floor1Y - slabThickness - floorHeightPx : floor1Y;
  
  const roofHeightPx = 65;
  const roofApexY = (is2Floors ? floor2Y : floor1Y) - roofHeightPx;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Visualisasi Potongan Arsitektur & Dimensi Ketinggian</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {is2Floors ? 'Model 2 Lantai' : 'Model 1 Lantai'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tinggi Dinding: <span className="font-semibold text-slate-800 tabular-nums">{wallHeight} m</span> · 
            Lebar: <span className="font-semibold text-slate-800 tabular-nums">{project.houseWidth} m</span> · 
            Total Luas: <span className="font-semibold text-slate-800 tabular-nums">{calculation.totalBuildingArea} m²</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-block w-3 h-3 rounded-xs bg-amber-500/80"></span>
          <span>Struktur Beton</span>
          <span className="inline-block w-3 h-3 rounded-xs bg-slate-300 ml-2"></span>
          <span>Dinding {isHebel ? 'Hebel' : 'Bata Merah'}</span>
          {hasCeiling && (
            <>
              <span className={`inline-block w-3 h-3 rounded-xs ml-2 ${project.ceilingType === 'pvc' ? 'bg-amber-600' : 'bg-sky-500'}`}></span>
              <span>{project.ceilingType === 'pvc' ? 'Plafon PVC' : 'Plafon Gypsum'}</span>
            </>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-x-auto bg-slate-50/70 rounded-lg p-2 flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full max-w-[620px] h-auto select-none"
        >
          <defs>
            {/* Pattern for Hebel */}
            <pattern id="hebelPattern" width="20" height="10" patternUnits="userSpaceOnUse">
              <rect width="20" height="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.75" />
            </pattern>
            {/* Pattern for Red Brick */}
            <pattern id="brickPattern" width="16" height="8" patternUnits="userSpaceOnUse">
              <rect width="16" height="8" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.75" />
            </pattern>
            {/* Pattern for Concrete / Footplate */}
            <pattern id="concretePattern" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#e2e8f0" />
              <circle cx="3" cy="3" r="1.5" fill="#94a3b8" />
              <circle cx="9" cy="9" r="1" fill="#64748b" />
            </pattern>
            {/* Pattern for Foundation Stone */}
            <pattern id="stonePattern" width="24" height="16" patternUnits="userSpaceOnUse">
              <rect width="24" height="16" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
              <line x1="0" y1="8" x2="24" y2="8" stroke="#94a3b8" strokeWidth="0.5" />
              <line x1="12" y1="0" x2="12" y2="16" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Ground Line */}
          <line
            x1="30"
            y1={groundY}
            x2={svgWidth - 30}
            y2={groundY}
            stroke="#64748b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <text x="40" y={groundY + 16} fill="#64748b" fontSize="10" fontFamily="sans-serif">
            ± 0.00 Muka Tanah
          </text>

          {/* Foundation: Batu Kali Rollag / Menerus */}
          <polygon
            points={`${houseX - 15},${groundY} ${houseX + 35},${groundY} ${houseX + 45},${groundY + 45} ${houseX - 25},${groundY + 45}`}
            fill="url(#stonePattern)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <polygon
            points={`${houseX + houseW - 35},${groundY} ${houseX + houseW + 15},${groundY} ${houseX + houseW + 25},${groundY + 45} ${houseX + houseW - 45},${groundY + 45}`}
            fill="url(#stonePattern)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <polygon
            points={`${houseX + houseW / 2 - 25},${groundY} ${houseX + houseW / 2 + 25},${groundY} ${houseX + houseW / 2 + 35},${groundY + 45} ${houseX + houseW / 2 - 35},${groundY + 45}`}
            fill="url(#stonePattern)"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <text x={houseX - 5} y={groundY + 30} fill="#334155" fontSize="8" fontWeight="600">
            Batu Kali
          </text>

          {/* Dynamic Foundation Elements (Footplat, Cakar Ayam, Strauss Pile) */}
          {calculation.foundationType === 'footplat' && (
            <>
              {/* Footplat Pad under left, middle, right columns */}
              {[houseX - 8, houseX + houseW / 2 - 16, houseX + houseW - 24].map((xPos, idx) => (
                <g key={`footplat-${idx}`}>
                  <rect
                    x={xPos - 12}
                    y={groundY + 42}
                    width="44"
                    height="16"
                    fill="url(#concretePattern)"
                    stroke="#0f172a"
                    strokeWidth="1.2"
                    rx="1.5"
                  />
                  {/* Single layer rebar wire */}
                  <line x1={xPos - 8} y1={groundY + 50} x2={xPos + 28} y2={groundY + 50} stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 2" />
                </g>
              ))}
              <text x={houseX - 18} y={groundY + 54} fill="#92400e" fontSize="7.5" fontWeight="bold">
                Footplat
              </text>
            </>
          )}

          {calculation.foundationType === 'cakar_ayam' && (
            <>
              {/* Cakar Ayam Rigid Double Grid Pad */}
              {[houseX - 8, houseX + houseW / 2 - 16, houseX + houseW - 24].map((xPos, idx) => (
                <g key={`cakar-${idx}`}>
                  <rect
                    x={xPos - 18}
                    y={groundY + 40}
                    width="56"
                    height="20"
                    fill="#475569"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    rx="2"
                  />
                  {/* Double mesh rebar indication */}
                  <line x1={xPos - 14} y1={groundY + 45} x2={xPos + 34} y2={groundY + 45} stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1={xPos - 14} y1={groundY + 54} x2={xPos + 34} y2={groundY + 54} stroke="#f59e0b" strokeWidth="1.5" />
                  {/* Vertical claw anchors */}
                  <line x1={xPos - 8} y1={groundY + 43} x2={xPos - 8} y2={groundY + 57} stroke="#f59e0b" strokeWidth="1.2" />
                  <line x1={xPos + 10} y1={groundY + 43} x2={xPos + 10} y2={groundY + 57} stroke="#f59e0b" strokeWidth="1.2" />
                  <line x1={xPos + 28} y1={groundY + 43} x2={xPos + 28} y2={groundY + 57} stroke="#f59e0b" strokeWidth="1.2" />
                </g>
              ))}
              <text x={houseX - 22} y={groundY + 56} fill="#b45309" fontSize="7.5" fontWeight="bold">
                Cakar Ayam Dobel
              </text>
            </>
          )}

          {calculation.foundationType === 'strauss_pile' && (
            <>
              {/* Strauss Pile: Pile cap + Deep bored cylinder */}
              {[houseX - 8, houseX + houseW / 2 - 16, houseX + houseW - 24].map((xPos, idx) => (
                <g key={`strauss-${idx}`}>
                  {/* Pile Cap */}
                  <rect
                    x={xPos - 12}
                    y={groundY + 40}
                    width="44"
                    height="14"
                    fill="#334155"
                    stroke="#0f172a"
                    strokeWidth="1.2"
                    rx="1"
                  />
                  {/* Bored Pile Cylinder */}
                  <rect
                    x={xPos}
                    y={groundY + 54}
                    width="20"
                    height="32"
                    fill="url(#concretePattern)"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                  {/* Spiral rebar indication */}
                  <path
                    d={`M ${xPos + 2} ${groundY + 58} Q ${xPos + 10} ${groundY + 62} ${xPos + 18} ${groundY + 58} Q ${xPos + 10} ${groundY + 68} ${xPos + 2} ${groundY + 74} Q ${xPos + 10} ${groundY + 80} ${xPos + 18} ${groundY + 84}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                  />
                </g>
              ))}
              <text x={houseX - 24} y={groundY + 56} fill="#b45309" fontSize="7.5" fontWeight="bold">
                Strauss Pile Ø25
              </text>
            </>
          )}

          {calculation.foundationType === 'batu_kali' && (
            <text x={houseX - 18} y={groundY + 54} fill="#475569" fontSize="7.5" fontWeight="bold">
              Tanpa Titik Tapak
            </text>
          )}

          {/* Sloof Beton Lantai 1 */}
          <rect
            x={houseX}
            y={groundY - 14}
            width={houseW}
            height="14"
            fill="#cbd5e1"
            stroke="#475569"
            strokeWidth="1.5"
          />
          <text x={houseX + houseW / 2} y={groundY - 4} textAnchor="middle" fill="#334155" fontSize="8" fontWeight="600">
            Sloof Beton 15x20
          </text>

          {/* Floor 1 Floor Finishing (Tile) */}
          {hasTiles && (
            <rect
              x={houseX + 16}
              y={groundY - 18}
              width={houseW - 32}
              height="4"
              fill="#d97706"
              stroke="#b45309"
              strokeWidth="0.8"
            />
          )}

          {/* Floor 1 Walls */}
          <rect
            x={houseX + 16}
            y={floor1Y}
            width={houseW - 32}
            height={groundY - 14 - floor1Y}
            fill={isHebel ? 'url(#hebelPattern)' : 'url(#brickPattern)'}
            stroke="#94a3b8"
            strokeWidth="1"
          />

          {/* Floor 1 Interior Door & Window representation */}
          <rect
            x={houseX + 45}
            y={groundY - 14 - 68}
            width="34"
            height="68"
            fill="#fed7aa"
            stroke="#c2410c"
            strokeWidth="1.2"
          />
          <rect
            x={houseX + 130}
            y={groundY - 14 - 55}
            width="50"
            height="40"
            fill="#bae6fd"
            stroke="#0284c7"
            strokeWidth="1.2"
          />

          {/* Concrete Columns Floor 1 */}
          <rect
            x={houseX}
            y={floor1Y}
            width="16"
            height={groundY - 14 - floor1Y}
            fill="#94a3b8"
            stroke="#334155"
            strokeWidth="1.2"
          />
          <rect
            x={houseX + houseW - 16}
            y={floor1Y}
            width="16"
            height={groundY - 14 - floor1Y}
            fill="#94a3b8"
            stroke="#334155"
            strokeWidth="1.2"
          />
          {/* Middle column */}
          <rect
            x={houseX + houseW / 2 - 8}
            y={floor1Y}
            width="16"
            height={groundY - 14 - floor1Y}
            fill="#94a3b8"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Floor 1 Ceiling Line */}
          {hasCeiling && (
            <line
              x1={houseX + 16}
              y1={floor1Y + 12}
              x2={houseX + houseW - 16}
              y2={floor1Y + 12}
              stroke={project.ceilingType === 'pvc' ? '#d97706' : '#0ea5e9'}
              strokeWidth={project.ceilingType === 'pvc' ? '3' : '2.5'}
              strokeDasharray={project.ceilingType === 'pvc' ? '8 3' : '6 3'}
            />
          )}

          {/* IF 2 FLOORS: Concrete Floor Slab (Dak Beton) & Floor 2 Walls */}
          {is2Floors ? (
            <>
              {/* Balok & Plat Dak Lantai 2 */}
              <rect
                x={houseX - 8}
                y={floor1Y - slabThickness}
                width={houseW + 16}
                height={slabThickness}
                fill="#64748b"
                stroke="#1e293b"
                strokeWidth="1.5"
                rx="1"
              />
              <text
                x={houseX + houseW / 2}
                y={floor1Y - 4}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="8"
                fontWeight="700"
              >
                Dak Beton Lantai 2 (t=12cm + Bondek M8)
              </text>

              {/* Floor 2 Walls */}
              <rect
                x={houseX + 16}
                y={floor2Y}
                width={houseW - 32}
                height={floor1Y - slabThickness - floor2Y}
                fill={isHebel ? 'url(#hebelPattern)' : 'url(#brickPattern)'}
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* Floor 2 Window / Balcony */}
              <rect
                x={houseX + 60}
                y={floor1Y - slabThickness - 55}
                width="50"
                height="40"
                fill="#bae6fd"
                stroke="#0284c7"
                strokeWidth="1.2"
              />
              <rect
                x={houseX + 165}
                y={floor1Y - slabThickness - 55}
                width="50"
                height="40"
                fill="#bae6fd"
                stroke="#0284c7"
                strokeWidth="1.2"
              />

              {/* Floor 2 Concrete Columns */}
              <rect
                x={houseX}
                y={floor2Y}
                width="16"
                height={floor1Y - slabThickness - floor2Y}
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth="1.2"
              />
              <rect
                x={houseX + houseW - 16}
                y={floor2Y}
                width="16"
                height={floor1Y - slabThickness - floor2Y}
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth="1.2"
              />
              <rect
                x={houseX + houseW / 2 - 8}
                y={floor2Y}
                width="16"
                height={floor1Y - slabThickness - floor2Y}
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth="1.2"
              />

              {/* Floor 2 Ringbalk */}
              <rect
                x={houseX}
                y={floor2Y - 12}
                width={houseW}
                height="12"
                fill="#cbd5e1"
                stroke="#475569"
                strokeWidth="1.2"
              />

              {/* Floor 2 Ceiling */}
              {hasCeiling && (
                <line
                  x1={houseX + 16}
                  y1={floor2Y + 12}
                  x2={houseX + houseW - 16}
                  y2={floor2Y + 12}
                  stroke={project.ceilingType === 'pvc' ? '#d97706' : '#0ea5e9'}
                  strokeWidth={project.ceilingType === 'pvc' ? '3' : '2.5'}
                  strokeDasharray={project.ceilingType === 'pvc' ? '8 3' : '6 3'}
                />
              )}
            </>
          ) : (
            /* Floor 1 Ringbalk */
            <rect
              x={houseX}
              y={floor1Y - 12}
              width={houseW}
              height="12"
              fill="#cbd5e1"
              stroke="#475569"
              strokeWidth="1.2"
            />
          )}

          {/* Roof Structure: Kuda-kuda Baja Ringan & Genteng */}
          {hasRoof && (
            <g>
              {/* Roof Truss Outline */}
              {(() => {
                const roofBaseY = is2Floors ? floor2Y - 12 : floor1Y - 12;
                const overhang = 24;
                return (
                  <>
                    {/* Roof Pitch Polygon */}
                    <polygon
                      points={`${houseX - overhang},${roofBaseY} ${houseX + houseW / 2},${roofApexY} ${houseX + houseW + overhang},${roofBaseY}`}
                      fill="#f1f5f9"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    {/* Ridge Covering / Genteng Metal */}
                    <line
                      x1={houseX - overhang - 4}
                      y1={roofBaseY}
                      x2={houseX + houseW / 2}
                      y2={roofApexY - 3}
                      stroke="#b91c1c"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <line
                      x1={houseX + houseW + overhang + 4}
                      y1={roofBaseY}
                      x2={houseX + houseW / 2}
                      y2={roofApexY - 3}
                      stroke="#b91c1c"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Internal Truss Webbing (Kuda-kuda Baja Ringan) */}
                    <line
                      x1={houseX + houseW / 2}
                      y1={roofApexY}
                      x2={houseX + houseW / 2}
                      y2={roofBaseY}
                      stroke="#64748b"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={houseX + houseW * 0.25}
                      y1={roofBaseY}
                      x2={houseX + houseW / 2}
                      y2={roofApexY + 28}
                      stroke="#64748b"
                      strokeWidth="1.2"
                    />
                    <line
                      x1={houseX + houseW * 0.75}
                      y1={roofBaseY}
                      x2={houseX + houseW / 2}
                      y2={roofApexY + 28}
                      stroke="#64748b"
                      strokeWidth="1.2"
                    />

                    {/* Text Label */}
                    <text
                      x={houseX + houseW / 2}
                      y={roofApexY + 45}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="9"
                      fontWeight="600"
                    >
                      Kuda-Kuda Baja Ringan & Genteng Metal
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* DIMENSION LINES & LABELS */}
          {/* Wall Height Annotation (Left side) */}
          <g>
            {/* Floor 1 Height Arrow */}
            <line
              x1={houseX - 45}
              y1={groundY - 14}
              x2={houseX - 45}
              y2={floor1Y}
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <line x1={houseX - 52} y1={groundY - 14} x2={houseX - 38} y2={groundY - 14} stroke="#0284c7" strokeWidth="1.5" />
            <line x1={houseX - 52} y1={floor1Y} x2={houseX - 38} y2={floor1Y} stroke="#0284c7" strokeWidth="1.5" />
            <rect
              x={houseX - 85}
              y={floor1Y + (groundY - 14 - floor1Y) / 2 - 10}
              width="36"
              height="18"
              fill="#0284c7"
              rx="3"
            />
            <text
              x={houseX - 67}
              y={floor1Y + (groundY - 14 - floor1Y) / 2 + 2}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
            >
              {wallHeight}m
            </text>

            {/* If 2 Floors, Floor 2 Height Arrow */}
            {is2Floors && (
              <>
                <line
                  x1={houseX - 45}
                  y1={floor1Y - slabThickness}
                  x2={houseX - 45}
                  y2={floor2Y}
                  stroke="#0284c7"
                  strokeWidth="1.5"
                />
                <line x1={houseX - 52} y1={floor1Y - slabThickness} x2={houseX - 38} y2={floor1Y - slabThickness} stroke="#0284c7" strokeWidth="1.5" />
                <line x1={houseX - 52} y1={floor2Y} x2={houseX - 38} y2={floor2Y} stroke="#0284c7" strokeWidth="1.5" />
                <rect
                  x={houseX - 85}
                  y={floor2Y + (floor1Y - slabThickness - floor2Y) / 2 - 10}
                  width="36"
                  height="18"
                  fill="#0284c7"
                  rx="3"
                />
                <text
                  x={houseX - 67}
                  y={floor2Y + (floor1Y - slabThickness - floor2Y) / 2 + 2}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {wallHeight}m
                </text>
              </>
            )}
          </g>

          {/* Width Dimension (Bottom) */}
          <line
            x1={houseX}
            y1={groundY + 68}
            x2={houseX + houseW}
            y2={groundY + 68}
            stroke="#475569"
            strokeWidth="1.2"
          />
          <line x1={houseX} y1={groundY + 62} x2={houseX} y2={groundY + 74} stroke="#475569" strokeWidth="1.2" />
          <line x1={houseX + houseW} y1={groundY + 62} x2={houseX + houseW} y2={groundY + 74} stroke="#475569" strokeWidth="1.2" />
          <text
            x={houseX + houseW / 2}
            y={groundY + 65}
            textAnchor="middle"
            fill="#1e293b"
            fontSize="10"
            fontWeight="bold"
            className="bg-white"
          >
            Lebar Bangunan: {project.houseWidth} Meter (Panjang: {project.houseLength} Meter)
          </text>

          {/* Story Indicator Badges (Right side) */}
          <g>
            <rect
              x={houseX + houseW + 20}
              y={floor1Y + 15}
              width="68"
              height="24"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1"
              rx="4"
            />
            <text x={houseX + houseW + 54} y={floor1Y + 31} textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
              Lantai 1 ({calculation.groundArea} m²)
            </text>

            {is2Floors && (
              <>
                <rect
                  x={houseX + houseW + 20}
                  y={floor2Y + 15}
                  width="68"
                  height="24"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  rx="4"
                />
                <text x={houseX + houseW + 54} y={floor2Y + 31} textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="bold">
                  Lantai 2 ({calculation.secondFloorArea} m²)
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Luas Dinding Netto</span>
          <span className="font-bold text-slate-800 tabular-nums">{calculation.totalWallArea} m²</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Estimasi Luas Atap</span>
          <span className="font-bold text-slate-800 tabular-nums">{calculation.roofArea} m²</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Luas Plafon</span>
          <span className="font-bold text-slate-800 tabular-nums">
            {hasCeiling ? `${calculation.ceilingArea} m²` : 'Tidak Dihitung'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Sistem Pondasi</span>
          <span className="font-bold text-amber-900 block truncate">
            {calculation.foundationType === 'cakar_ayam' ? 'Cakar Ayam Dobel' :
             calculation.foundationType === 'footplat' ? 'Footplat Telapak' :
             calculation.foundationType === 'strauss_pile' ? 'Strauss Pile Ø25' : 'Batu Kali Saja'}
          </span>
          <span className="text-[10px] text-slate-500">
            {calculation.foundationPoints > 0 ? `${calculation.foundationPoints} Titik (${calculation.foundationConcreteVol} m³ Cor)` : 'Tanpa Titik Cor'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Status Plafon</span>
          <span className={`font-semibold block ${hasCeiling ? (project.ceilingType === 'pvc' ? 'text-amber-800' : 'text-sky-700') : 'text-slate-500'}`}>
            {hasCeiling 
              ? (project.ceilingType === 'pvc' ? 'Plafon PVC Tahan Air' : 'Plafon Gypsum 9mm') 
              : 'Tanpa Plafon'}
          </span>
        </div>
      </div>
    </div>
  );
};
