import React, { useMemo, useState } from 'react';
import { Eye, Minus, Plus, RotateCcw } from 'lucide-react';
import { LabPresetId, SimulationPreset } from '../types/worksheet';
import { MathFormula } from './MathFormula';

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'mercusuar',
    label: 'Menara Mercusuar',
    contextTitle: 'Kasus Pengawasan Pantai',
    contextDesc:
      'Petugas mercusuar setinggi 45 m mengamati sebuah kapal kargo dengan sudut depresi 30°.',
    heightM: 45,
    angleDeg: 30,
    targetLabel: 'Kapal Kargo',
  },
  {
    id: 'drone',
    label: 'Drone Pemantau',
    contextTitle: 'Kasus Pemantauan Lalu Lintas',
    contextDesc:
      'Drone melayang pada ketinggian 60 m dan mendeteksi kendaraan mogok pada sudut depresi 45°.',
    heightM: 60,
    angleDeg: 45,
    targetLabel: 'Kendaraan',
  },
  {
    id: 'tebing',
    label: 'Tebing Tim SAR',
    contextTitle: 'Kasus Evakuasi Pesisir',
    contextDesc:
      'Pos pengamatan di tebing setinggi 80 m melihat perahu nelayan pada sudut depresi 60°.',
    heightM: 80,
    angleDeg: 60,
    targetLabel: 'Perahu SAR',
  },
  {
    id: 'bebas',
    label: 'Mode Bebas',
    contextTitle: 'Eksperimen Mandiri',
    contextDesc:
      'Ubah tinggi pengamat dan sudut depresi sesukamu untuk melihat bagaimana jarak horizontal berubah.',
    heightM: 40,
    angleDeg: 37,
    targetLabel: 'Objek Target',
  },
];

interface TrigoLabSimulatorProps {
  heightM: number;
  angleDeg: number;
  onChangeParams: (heightM: number, angleDeg: number, distanceM: number) => void;
  activePreset: LabPresetId;
  onSelectPreset: (presetId: LabPresetId) => void;
}

export const TrigoLabSimulator: React.FC<TrigoLabSimulatorProps> = ({
  heightM,
  angleDeg,
  onChangeParams,
  activePreset,
  onSelectPreset,
}) => {
  const [showAlternateAngle, setShowAlternateAngle] = useState(false);
  const [showRightTriangle, setShowRightTriangle] = useState(false);
  const [showHorizontalDistance, setShowHorizontalDistance] = useState(false);

  const allAuxHidden =
    !showAlternateAngle && !showRightTriangle && !showHorizontalDistance;

  const setOnlyGivenInfo = () => {
    if (allAuxHidden) {
      setShowAlternateAngle(true);
      setShowRightTriangle(true);
      setShowHorizontalDistance(true);
    } else {
      setShowAlternateAngle(false);
      setShowRightTriangle(false);
      setShowHorizontalDistance(false);
    }
  };

  const metrics = useMemo(() => {
    const rad = (angleDeg * Math.PI) / 180;
    const tanVal = Math.tan(rad);
    const horizontalDist = heightM / tanVal;
    return {
      tanVal,
      horizontalDist,
    };
  }, [heightM, angleDeg]);

  const updateValues = (nextHeight: number, nextAngle: number) => {
    const clampedH = Math.min(120, Math.max(10, nextHeight));
    const clampedA = Math.min(80, Math.max(10, nextAngle));
    const rad = (clampedA * Math.PI) / 180;
    const dist = clampedH / Math.tan(rad);
    onChangeParams(clampedH, clampedA, Number(dist.toFixed(2)));
  };

  const handlePresetClick = (preset: SimulationPreset) => {
    onSelectPreset(preset.id);
    const rad = (preset.angleDeg * Math.PI) / 180;
    const dist = preset.heightM / Math.tan(rad);
    onChangeParams(preset.heightM, preset.angleDeg, Number(dist.toFixed(2)));
  };

  // Fixed 1:1 metric scale both vertically and horizontally:
  // 1 meter = 2 px vertically AND horizontally (1 blueprint grid square of 20px = 10m x 10m).
  const svgGeom = useMemo(() => {
    const PX_PER_METER = 2.0;
    const baseX = 120;
    const groundY = 320;

    const hPx = heightM * PX_PER_METER;
    const dPx = metrics.horizontalDist * PX_PER_METER;

    const eyeY = groundY - hPx;
    const targetX = baseX + dPx;
    const viewWidth = Math.max(720, Math.ceil((targetX + 80) / 20) * 20);

    const rayLen = Math.hypot(hPx, dPx);
    const rad = Math.atan2(hPx, dPx);

    // Angle arc at observer eye (from 0 deg horizontal down to angleDeg)
    const arcRadius = Math.min(48, Math.max(14, Math.min(rayLen * 0.65, hPx * 0.75)));
    const arcEndX = baseX + arcRadius * Math.cos(rad);
    const arcEndY = eyeY + arcRadius * Math.sin(rad);

    // Alternate interior angle arc at target (from 180 deg horizontal left up to line of sight)
    const altArcRadius = Math.min(44, Math.max(14, Math.min(rayLen * 0.6, hPx * 0.7)));
    const altArcEndX = targetX - altArcRadius * Math.cos(rad);
    const altArcEndY = groundY - altArcRadius * Math.sin(rad);

    const horizEndX = Math.max(baseX + 165, Math.min(viewWidth - 24, targetX + 56));
    const rightAngleSize = Math.max(4, Math.min(14, hPx * 0.45, Math.max(4, dPx * 0.6)));
    const angleLabelY = Math.min(groundY - 6, eyeY + Math.max(12, Math.min(20, arcRadius * 0.45)));
    const altHasRoomLeft = targetX - altArcRadius - 62 > baseX;

    return {
      baseX,
      groundY,
      eyeY,
      targetX,
      dPx,
      hPx,
      viewWidth,
      arcRadius,
      arcEndX,
      arcEndY,
      altArcRadius,
      altArcEndX,
      altArcEndY,
      horizEndX,
      rightAngleSize,
      angleLabelY,
      altHasRoomLeft,
    };
  }, [heightM, metrics.horizontalDist]);

  const currentPresetObj =
    SIMULATION_PRESETS.find((p) => p.id === activePreset) || SIMULATION_PRESETS[0];

  return (
    <section
      id="simulasi"
      aria-labelledby="simulasi-heading"
      className="py-6 sm:py-8 lg:py-10 border-t border-slate-200 scroll-mt-28"
    >
      <div className="flex flex-col gap-1.5 mb-3 sm:mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Bagian 02 · Laboratorium Virtual
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2.5">
          <div>
            <h2
              id="simulasi-heading"
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight text-balance"
            >
              Simulasi Sudut Depresi & Jarak Horizontal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
              Geser tinggi pengamat dan sudut depresi untuk mengamati perubahan jarak secara langsung.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handlePresetClick(SIMULATION_PRESETS[0])}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulasi</span>
          </button>
        </div>
      </div>

      {/* Preset Selector (Single-row horizontal scroll on mobile, wrap on larger screens) */}
      <div
        role="group"
        aria-label="Pilih skenario kasus simulasi"
        className="flex overflow-x-auto sm:flex-wrap gap-1.5 sm:gap-2 pb-1 mb-3 sm:mb-4"
      >
        {SIMULATION_PRESETS.map((preset) => {
          const isActive = preset.id === activePreset;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 min-h-[38px] sm:min-h-[42px] text-xs sm:text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Unified 1-Panel Stage + Compact Controls (1 screen across smartphone, tablet, and desktop) */}
      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
        {/* Top Stage Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-slate-200 bg-slate-50/70">
          <div className="text-[11px] sm:text-xs text-slate-600 truncate">
            <span className="font-semibold text-slate-900">{currentPresetObj.contextTitle}</span>
            <span className="mx-1.5 text-slate-400" aria-hidden="true">
              ·
            </span>
            <span>Target: {currentPresetObj.targetLabel}</span>
          </div>

          <button
            type="button"
            onClick={setOnlyGivenInfo}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[32px] text-[11px] sm:text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              allAuxHidden
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{allAuxHidden ? 'Tampilkan Keterangan' : 'Hanya Info Soal (h & θ)'}</span>
          </button>
        </div>

        {/* Interactive SVG Stage (Fixed 1:1 display scale vertically & horizontally) */}
        <div className="relative bg-[#F8FAFC] p-1.5 sm:p-2.5 overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgGeom.viewWidth} 400`}
            width={svgGeom.viewWidth}
            height={400}
            className="block h-[160px] sm:h-[220px] lg:h-[270px] w-auto max-w-none mx-auto select-none"
            role="img"
            aria-label={`Diagram simulasi sudut depresi ${angleDeg} derajat pada ketinggian ${heightM} meter menghasilkan jarak horizontal ${metrics.horizontalDist.toFixed(
              2
            )} meter`}
          >
            <defs>
              <pattern id="lab-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="0.7"
                />
              </pattern>
            </defs>

            {/* Coordinate Blueprint Grid (1 square = 10m x 10m) */}
            <rect x="0" y="0" width={svgGeom.viewWidth} height="400" fill="url(#lab-grid)" />

            {/* Ground / Sea Surface */}
            <rect
              x="0"
              y={svgGeom.groundY}
              width={svgGeom.viewWidth}
              height={400 - svgGeom.groundY}
              fill="#EFF6FF"
            />
            <line
              x1="0"
              y1={svgGeom.groundY}
              x2={svgGeom.viewWidth}
              y2={svgGeom.groundY}
              stroke="#64748B"
              strokeWidth="2"
            />

              {/* Right Triangle Shading */}
              {showRightTriangle && (
                <polygon
                  points={`${svgGeom.baseX},${svgGeom.eyeY} ${svgGeom.baseX},${svgGeom.groundY} ${svgGeom.targetX},${svgGeom.groundY}`}
                  fill="#2563EB"
                  fillOpacity="0.1"
                />
              )}

              {/* Tower / Observation Structure */}
              {activePreset === 'drone' ? (
                <g>
                  {/* Vertical altitude drop line for drone */}
                  <line
                    x1={svgGeom.baseX}
                    y1={svgGeom.eyeY}
                    x2={svgGeom.baseX}
                    y2={svgGeom.groundY}
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Drone icon */}
                  <rect
                    x={svgGeom.baseX - 18}
                    y={svgGeom.eyeY - 8}
                    width="36"
                    height="12"
                    rx="4"
                    fill="#1E293B"
                  />
                  <line
                    x1={svgGeom.baseX - 24}
                    y1={svgGeom.eyeY - 12}
                    x2={svgGeom.baseX - 8}
                    y2={svgGeom.eyeY - 12}
                    stroke="#2563EB"
                    strokeWidth="3"
                  />
                  <line
                    x1={svgGeom.baseX + 8}
                    y1={svgGeom.eyeY - 12}
                    x2={svgGeom.baseX + 24}
                    y2={svgGeom.eyeY - 12}
                    stroke="#2563EB"
                    strokeWidth="3"
                  />
                </g>
              ) : (
                <g>
                  <rect
                    x={svgGeom.baseX - 32}
                    y={svgGeom.eyeY}
                    width="32"
                    height={svgGeom.groundY - svgGeom.eyeY}
                    fill="#FFFFFF"
                    stroke="#475569"
                    strokeWidth="2"
                  />
                  {/* Observation deck */}
                  <rect
                    x={svgGeom.baseX - 38}
                    y={svgGeom.eyeY - 10}
                    width="44"
                    height="10"
                    fill="#E2E8F0"
                    stroke="#475569"
                    strokeWidth="1.5"
                  />
                  {/* Observer dot */}
                  <circle cx={svgGeom.baseX} cy={svgGeom.eyeY} r="5" fill="#2563EB" />
                </g>
              )}

              {/* Right-angle marker at tower base */}
              <polyline
                points={`${svgGeom.baseX},${svgGeom.groundY - svgGeom.rightAngleSize} ${
                  svgGeom.baseX + svgGeom.rightAngleSize
                },${svgGeom.groundY - svgGeom.rightAngleSize} ${
                  svgGeom.baseX + svgGeom.rightAngleSize
                },${svgGeom.groundY}`}
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Horizontal Eye-Level Reference Line (Garis Pandang Horizontal) */}
              <line
                x1={svgGeom.baseX}
                y1={svgGeom.eyeY}
                x2={svgGeom.horizEndX}
                y2={svgGeom.eyeY}
                stroke="#2563EB"
                strokeWidth="1.8"
                strokeDasharray="6 5"
              />
              <text
                x={svgGeom.horizEndX - 3}
                y={svgGeom.eyeY - 8}
                textAnchor="end"
                fill="#2563EB"
                fontSize="11"
                fontWeight="600"
              >
                Garis Horizontal (0°)
              </text>

              {/* Line of Sight (Sisi Miring) */}
              <line
                x1={svgGeom.baseX}
                y1={svgGeom.eyeY}
                x2={svgGeom.targetX}
                y2={svgGeom.groundY}
                stroke="#1E293B"
                strokeWidth="2.4"
              />

              {/* Angle of Depression Arc (Top) */}
              <path
                d={`M ${svgGeom.baseX + svgGeom.arcRadius} ${svgGeom.eyeY} A ${
                  svgGeom.arcRadius
                } ${svgGeom.arcRadius} 0 0 1 ${svgGeom.arcEndX} ${svgGeom.arcEndY}`}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
              />
              <path
                d={`M ${svgGeom.baseX} ${svgGeom.eyeY} L ${
                  svgGeom.baseX + svgGeom.arcRadius
                } ${svgGeom.eyeY} A ${svgGeom.arcRadius} ${svgGeom.arcRadius} 0 0 1 ${
                  svgGeom.arcEndX
                } ${svgGeom.arcEndY} Z`}
                fill="#2563EB"
                fillOpacity="0.18"
              />
              <text
                x={svgGeom.baseX + svgGeom.arcRadius + 10}
                y={svgGeom.angleLabelY}
                fill="#1D4ED8"
                fontSize="13"
                fontWeight="700"
                fontFamily="IBM Plex Mono, monospace"
              >
                θ = {angleDeg}°
              </text>

              {/* Alternate Interior Angle Arc (Bottom Target) */}
              {showAlternateAngle && (
                <g>
                  <path
                    d={`M ${svgGeom.targetX - svgGeom.altArcRadius} ${svgGeom.groundY} A ${
                      svgGeom.altArcRadius
                    } ${svgGeom.altArcRadius} 0 0 1 ${svgGeom.altArcEndX} ${
                      svgGeom.altArcEndY
                    }`}
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="2.2"
                  />
                  <text
                    x={
                      svgGeom.altHasRoomLeft
                        ? svgGeom.targetX - svgGeom.altArcRadius - 8
                        : svgGeom.targetX + 10
                    }
                    y={svgGeom.altHasRoomLeft ? svgGeom.groundY - 12 : svgGeom.groundY - 18}
                    textAnchor={svgGeom.altHasRoomLeft ? 'end' : 'start'}
                    fill="#0369A1"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    θ = {angleDeg}°
                  </text>
                </g>
              )}

              {/* Target Marker (Ship / Car / Boat) */}
              <g transform={`translate(${svgGeom.targetX}, ${svgGeom.groundY})`}>
                <path d="M -14 -2 L 14 -2 L 10 5 L -10 5 Z" fill="#1E293B" />
                <rect x="-6" y="-10" width="12" height="8" rx="2" fill="#2563EB" />
                <circle cx="0" cy="0" r="2.5" fill="#FFFFFF" />
                <text
                  x="0"
                  y="20"
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize="11"
                  fontWeight="600"
                >
                  {currentPresetObj.targetLabel}
                </text>
              </g>

              {/* Height Dimension Label (h) */}
              <line
                x1={svgGeom.baseX - 48}
                y1={svgGeom.eyeY}
                x2={svgGeom.baseX - 48}
                y2={svgGeom.groundY}
                stroke="#64748B"
                strokeWidth="1.2"
              />
              <line
                x1={svgGeom.baseX - 53}
                y1={svgGeom.eyeY}
                x2={svgGeom.baseX - 43}
                y2={svgGeom.eyeY}
                stroke="#64748B"
                strokeWidth="1.2"
              />
              <line
                x1={svgGeom.baseX - 53}
                y1={svgGeom.groundY}
                x2={svgGeom.baseX - 43}
                y2={svgGeom.groundY}
                stroke="#64748B"
                strokeWidth="1.2"
              />
              <rect
                x={svgGeom.baseX - 102}
                y={(svgGeom.eyeY + svgGeom.groundY) / 2 - 11}
                width="50"
                height="22"
                rx="4"
                fill="#FFFFFF"
                stroke="#E2E8F0"
              />
              <text
                x={svgGeom.baseX - 77}
                y={(svgGeom.eyeY + svgGeom.groundY) / 2 + 4}
                textAnchor="middle"
                fill="#1E293B"
                fontSize="11"
                fontWeight="600"
                fontFamily="IBM Plex Mono, monospace"
              >
                h={heightM}m
              </text>

              {/* Horizontal Distance Dimension Label (d) */}
              {showHorizontalDistance && (
                <g>
                  <line
                    x1={svgGeom.baseX}
                    y1={svgGeom.groundY + 44}
                    x2={svgGeom.targetX}
                    y2={svgGeom.groundY + 44}
                    stroke="#2563EB"
                    strokeWidth="1.6"
                  />
                  <circle cx={svgGeom.baseX} cy={svgGeom.groundY + 44} r="3" fill="#2563EB" />
                  <circle cx={svgGeom.targetX} cy={svgGeom.groundY + 44} r="3" fill="#2563EB" />
                  <rect
                    x={Math.max(svgGeom.baseX, (svgGeom.baseX + svgGeom.targetX) / 2 - 58)}
                    y={svgGeom.groundY + 33}
                    width="116"
                    height="22"
                    rx="4"
                    fill="#EFF6FF"
                    stroke="#BFDBFE"
                  />
                  <text
                    x={Math.max(svgGeom.baseX + 58, (svgGeom.baseX + svgGeom.targetX) / 2)}
                    y={svgGeom.groundY + 48}
                    textAnchor="middle"
                    fill="#1D4ED8"
                    fontSize="11.5"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    d = {metrics.horizontalDist.toFixed(2)} m
                  </text>
                </g>
              )}

          </svg>
        </div>

        {/* Context Description Strip */}
        <div className="px-3 sm:px-4 py-1.5 border-t border-slate-200 bg-white text-[11px] sm:text-xs text-slate-600">
          <p className="leading-snug">{currentPresetObj.contextDesc}</p>
        </div>

        {/* Integrated Compact Control Panel (Same Card, No Jarak d Readout) */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-slate-200 bg-slate-50/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-5">
            {/* Height Slider + Step Buttons */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-height" className="text-[11px] sm:text-xs font-medium text-slate-700">
                  Tinggi Pengamat (h)
                </label>
                <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900 tabular-nums">
                  {heightM} m
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Kurangi tinggi 5 meter"
                  onClick={() => updateValues(heightM - 5, angleDeg)}
                  className="min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  id="slider-height"
                  type="range"
                  min={10}
                  max={120}
                  step={1}
                  value={heightM}
                  onChange={(e) => updateValues(Number(e.target.value), angleDeg)}
                  className="w-full h-1.5 accent-blue-600 cursor-pointer"
                />
                <button
                  type="button"
                  aria-label="Tambah tinggi 5 meter"
                  onClick={() => updateValues(heightM + 5, angleDeg)}
                  className="min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                <span>10 m</span>
                <span>65 m</span>
                <span>120 m</span>
              </div>
            </div>

            {/* Angle Slider + Step Buttons */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-angle" className="text-[11px] sm:text-xs font-medium text-slate-700">
                  Sudut Depresi (θ)
                </label>
                <span className="font-mono text-xs sm:text-sm font-semibold text-blue-600 tabular-nums">
                  {angleDeg}°
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Kurangi sudut 1 derajat"
                  onClick={() => updateValues(heightM, angleDeg - 1)}
                  className="min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  id="slider-angle"
                  type="range"
                  min={10}
                  max={80}
                  step={1}
                  value={angleDeg}
                  onChange={(e) => updateValues(heightM, Number(e.target.value))}
                  className="w-full h-1.5 accent-blue-600 cursor-pointer"
                />
                <button
                  type="button"
                  aria-label="Tambah sudut 1 derajat"
                  onClick={() => updateValues(heightM, angleDeg + 1)}
                  className="min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono tabular-nums">
                <span>10° (jauh)</span>
                <span>45° (d = h)</span>
                <span>80° (dekat)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist & Live Calculation Readout Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Checklist Keterangan Gambar */}
        <div className="lg:col-span-7 border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white space-y-2.5 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">
              Tampilkan keterangan gambar (di luar info soal <MathFormula tex="h" /> &amp;{' '}
              <MathFormula tex="\theta" />):
            </span>
            <button
              type="button"
              onClick={setOnlyGivenInfo}
              className="text-blue-600 font-medium hover:underline cursor-pointer"
            >
              {allAuxHidden ? 'Tampilkan Semua' : 'Sembunyikan Semua'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="inline-flex items-center gap-2 min-h-[36px] px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer font-medium text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={showAlternateAngle}
                onChange={(e) => setShowAlternateAngle(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded shrink-0"
              />
              <span>Sudut berseberangan (θ bawah)</span>
            </label>

            <label className="inline-flex items-center gap-2 min-h-[36px] px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer font-medium text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={showRightTriangle}
                onChange={(e) => setShowRightTriangle(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded shrink-0"
              />
              <span>Arsir segitiga siku-siku</span>
            </label>

            <label className="inline-flex items-center gap-2 min-h-[36px] px-2.5 py-1.5 rounded-md border border-slate-200 bg-slate-50/50 cursor-pointer font-medium text-slate-700 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={showHorizontalDistance}
                onChange={(e) => setShowHorizontalDistance(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded shrink-0"
              />
              <span>Jarak horizontal (d)</span>
            </label>
          </div>
        </div>

        {/* Live LaTeX Calculation Readout */}
        <div className="lg:col-span-5 bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
            <span className="text-xs font-semibold text-blue-900">
              Kalkulasi Langsung Perbandingan Tangen
            </span>
            <span className="text-xs text-blue-700 tabular-nums">
              <MathFormula tex={`\\tan(${angleDeg}^\\circ) \\approx ${metrics.tanVal.toFixed(4)}`} />
            </span>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 space-y-1.5 tabular-nums">
            <MathFormula
              block
              tex={`\\tan(\\theta) = \\frac{\\text{depan}}{\\text{samping}} = \\frac{h}{d}`}
            />
            <MathFormula
              block
              tex={`d = \\frac{h}{\\tan(${angleDeg}^\\circ)} = \\frac{${heightM}}{${metrics.tanVal.toFixed(4)}} = ${metrics.horizontalDist.toFixed(2)}\\text{ m}`}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
