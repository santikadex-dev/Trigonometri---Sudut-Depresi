import React, { useMemo, useState } from 'react';
import { Eye, Layers, Minus, Plus, RotateCcw } from 'lucide-react';
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

  // Geometry coordinates inside SVG viewBox 720 x 400
  const svgGeom = useMemo(() => {
    const baseX = 112;
    const groundY = 336;
    const maxPxHeight = 220;
    const maxPxWidth = 500;

    // Visual proportion driven smoothly by ratio d / h while staying within viewport
    const ratio = metrics.horizontalDist / heightM; // cot(theta)
    let hPx = 155 + (heightM - 10) * 0.55;
    let dPx = hPx * ratio;

    if (dPx > maxPxWidth) {
      const scale = maxPxWidth / dPx;
      dPx = maxPxWidth;
      hPx = Math.max(68, hPx * scale);
    }
    if (hPx > maxPxHeight) {
      const scale = maxPxHeight / hPx;
      hPx = maxPxHeight;
      dPx = dPx * scale;
    }

    const eyeY = groundY - hPx;
    const targetX = Math.min(640, Math.max(baseX + 48, baseX + dPx));

    // Angle arc at observer eye (from 0 deg horizontal down to angleDeg)
    const arcRadius = Math.min(54, Math.max(28, dPx * 0.35));
    const rad = Math.atan2(groundY - eyeY, targetX - baseX);
    const arcEndX = baseX + arcRadius * Math.cos(rad);
    const arcEndY = eyeY + arcRadius * Math.sin(rad);

    // Alternate interior angle arc at target (from 180 deg horizontal left up to line of sight)
    const altArcRadius = Math.min(48, Math.max(26, dPx * 0.3));
    const altArcEndX = targetX - altArcRadius * Math.cos(rad);
    const altArcEndY = groundY - altArcRadius * Math.sin(rad);

    return {
      baseX,
      groundY,
      eyeY,
      targetX,
      arcRadius,
      arcEndX,
      arcEndY,
      altArcRadius,
      altArcEndX,
      altArcEndY,
      visualAngleDeg: Math.round((rad * 180) / Math.PI),
    };
  }, [heightM, metrics.horizontalDist]);

  const currentPresetObj =
    SIMULATION_PRESETS.find((p) => p.id === activePreset) || SIMULATION_PRESETS[0];

  return (
    <section
      id="simulasi"
      aria-labelledby="simulasi-heading"
      className="py-12 border-t border-slate-200"
    >
      <div className="flex flex-col gap-2 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Bagian 02 · Laboratorium Virtual
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2
              id="simulasi-heading"
              className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance"
            >
              Simulasi Sudut Depresi & Jarak Horizontal
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
              Geser tinggi pengamat dan sudut depresi untuk mengamati bagaimana perbandingan
              tangen menentukan jarak objek di permukaan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handlePresetClick(SIMULATION_PRESETS[0])}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors self-start md:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Simulasi</span>
          </button>
        </div>
      </div>

      {/* Preset Selector (Interactive Segmented Buttons) */}
      <div
        role="group"
        aria-label="Pilih skenario kasus simulasi"
        className="flex flex-wrap gap-2 mb-6"
      >
        {SIMULATION_PRESETS.map((preset) => {
          const isActive = preset.id === activePreset;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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

      {/* Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Zone: Interactive SVG Stage (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col border border-slate-200 rounded-xl bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/70">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{currentPresetObj.contextTitle}</span>
              <span className="mx-2 text-slate-400" aria-hidden="true">
                ·
              </span>
              <span>Target: {currentPresetObj.targetLabel}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={setOnlyGivenInfo}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  allAuxHidden
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{allAuxHidden ? 'Tampilkan Keterangan' : 'Hanya Info Soal (h & θ)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRightTriangle((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  showRightTriangle
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Segitiga Siku-Siku</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 bg-[#F8FAFC] p-2 sm:p-4 flex items-center justify-center">
            <svg
              viewBox="0 0 720 400"
              className="w-full h-auto max-h-[380px] select-none"
              role="img"
              aria-label={`Diagram simulasi sudut depresi ${angleDeg} derajat pada ketinggian ${heightM} meter menghasilkan jarak horizontal ${metrics.horizontalDist.toFixed(
                2
              )} meter`}
            >
              <defs>
                <pattern id="lab-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="0.7"
                  />
                </pattern>
              </defs>

              {/* Coordinate Blueprint Grid */}
              <rect x="0" y="0" width="720" height="400" fill="url(#lab-grid)" />

              {/* Ground / Sea Surface */}
              <rect
                x="0"
                y={svgGeom.groundY}
                width="720"
                height={400 - svgGeom.groundY}
                fill="#EFF6FF"
              />
              <line
                x1="0"
                y1={svgGeom.groundY}
                x2="720"
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
                points={`${svgGeom.baseX},${svgGeom.groundY - 14} ${svgGeom.baseX + 14},${
                  svgGeom.groundY - 14
                } ${svgGeom.baseX + 14},${svgGeom.groundY}`}
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Horizontal Eye-Level Reference Line (Garis Pandang Horizontal) */}
              <line
                x1={svgGeom.baseX}
                y1={svgGeom.eyeY}
                x2={Math.min(685, svgGeom.targetX + 45)}
                y2={svgGeom.eyeY}
                stroke="#2563EB"
                strokeWidth="1.8"
                strokeDasharray="6 5"
              />
              <text
                x={Math.min(685, svgGeom.targetX + 42)}
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
                y={svgGeom.eyeY + 20}
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
                    x={svgGeom.targetX - svgGeom.altArcRadius - 8}
                    y={svgGeom.groundY - 12}
                    textAnchor="end"
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
                <path d="M -18 -2 L 18 -2 L 13 6 L -13 6 Z" fill="#1E293B" />
                <rect x="-8" y="-11" width="14" height="9" rx="2" fill="#2563EB" />
                <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
                <text
                  x="0"
                  y="24"
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
                x={svgGeom.baseX - 96}
                y={(svgGeom.eyeY + svgGeom.groundY) / 2 - 12}
                width="44"
                height="22"
                rx="4"
                fill="#FFFFFF"
                stroke="#E2E8F0"
              />
              <text
                x={svgGeom.baseX - 74}
                y={(svgGeom.eyeY + svgGeom.groundY) / 2 + 3}
                textAnchor="middle"
                fill="#1E293B"
                fontSize="11.5"
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
                    y1={svgGeom.groundY + 34}
                    x2={svgGeom.targetX}
                    y2={svgGeom.groundY + 34}
                    stroke="#2563EB"
                    strokeWidth="1.6"
                  />
                  <circle cx={svgGeom.baseX} cy={svgGeom.groundY + 34} r="3" fill="#2563EB" />
                  <circle cx={svgGeom.targetX} cy={svgGeom.groundY + 34} r="3" fill="#2563EB" />
                  <rect
                    x={(svgGeom.baseX + svgGeom.targetX) / 2 - 58}
                    y={svgGeom.groundY + 23}
                    width="116"
                    height="22"
                    rx="4"
                    fill="#EFF6FF"
                    stroke="#BFDBFE"
                  />
                  <text
                    x={(svgGeom.baseX + svgGeom.targetX) / 2}
                    y={svgGeom.groundY + 38}
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

          <div className="px-4 py-3.5 border-t border-slate-200 bg-white space-y-3 text-xs text-slate-600">
            <p className="leading-relaxed">{currentPresetObj.contextDesc}</p>

            <div className="pt-2.5 border-t border-slate-100 space-y-2">
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
          </div>
        </div>

        {/* Right Zone: Controls & Live Calculation Deck (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-5 border border-slate-200 rounded-xl p-5 bg-white">
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Panel Kendali Pengamatan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Atur tinggi titik pengamatan dan sudut depresi secara langsung.
              </p>
            </div>

            {/* Height Slider + Step Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-height" className="text-sm font-medium text-slate-700">
                  Tinggi Pengamat (h)
                </label>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {heightM} m
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Kurangi tinggi 5 meter"
                  onClick={() => updateValues(heightM - 5, angleDeg)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="slider-height"
                  type="range"
                  min={10}
                  max={120}
                  step={1}
                  value={heightM}
                  onChange={(e) => updateValues(Number(e.target.value), angleDeg)}
                  className="w-full h-2 accent-blue-600 cursor-pointer"
                />
                <button
                  type="button"
                  aria-label="Tambah tinggi 5 meter"
                  onClick={() => updateValues(heightM + 5, angleDeg)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>10 m</span>
                <span>65 m</span>
                <span>120 m</span>
              </div>
            </div>

            {/* Angle Slider + Step Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="slider-angle" className="text-sm font-medium text-slate-700">
                  Sudut Depresi (θ)
                </label>
                <span className="font-mono text-sm font-semibold text-blue-600 tabular-nums">
                  {angleDeg}°
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Kurangi sudut 1 derajat"
                  onClick={() => updateValues(heightM, angleDeg - 1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="slider-angle"
                  type="range"
                  min={10}
                  max={80}
                  step={1}
                  value={angleDeg}
                  onChange={(e) => updateValues(heightM, Number(e.target.value))}
                  className="w-full h-2 accent-blue-600 cursor-pointer"
                />
                <button
                  type="button"
                  aria-label="Tambah sudut 1 derajat"
                  onClick={() => updateValues(heightM, angleDeg + 1)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>10° (jauh)</span>
                <span>45° (d = h)</span>
                <span>80° (dekat)</span>
              </div>
            </div>
          </div>

          {/* Live Calculation Readout */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
              <span className="text-xs font-semibold text-blue-900">
                Kalkulasi Langsung Perbandingan Tangen
              </span>
              <span className="text-xs text-blue-700 tabular-nums">
                <MathFormula tex={`\\tan(${angleDeg}^\\circ) \\approx ${metrics.tanVal.toFixed(4)}`} />
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-800 space-y-2 tabular-nums">
              <MathFormula
                block
                tex={`\\tan(\\theta) = \\frac{\\text{depan}}{\\text{samping}} = \\frac{h}{d}`}
              />
              <MathFormula
                block
                tex={`d = \\frac{h}{\\tan(${angleDeg}^\\circ)} = \\frac{${heightM}}{${metrics.tanVal.toFixed(4)}}`}
              />
            </div>

            <div className="pt-1">
              <div className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">Jarak Horizontal (d)</p>
                <p className="font-mono text-lg font-bold text-blue-600 tabular-nums">
                  {metrics.horizontalDist.toFixed(2)} m
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
