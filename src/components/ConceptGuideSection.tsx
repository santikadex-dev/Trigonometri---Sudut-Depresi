import React, { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { MathFormula } from './MathFormula';

export const ConceptGuideSection: React.FC = () => {
  const [angleInput, setAngleInput] = useState<string>('30');
  const [selectedAngle, setSelectedAngle] = useState<'A' | 'C'>('A');

  const tanCalc = useMemo(() => {
    const normalized = angleInput.trim().replace(',', '.');
    if (!normalized) {
      return { valid: false, reason: 'Masukkan sudut dalam derajat untuk melihat hasil.' };
    }
    const deg = Number(normalized);
    if (!Number.isFinite(deg)) {
      return { valid: false, reason: 'Input sudut harus berupa angka yang valid.' };
    }
    // Check asymptotic 90 + 180k degrees
    const mod180 = ((deg % 180) + 180) % 180;
    if (Math.abs(mod180 - 90) < 1e-6) {
      return {
        valid: false,
        deg,
        undefinedTan: true,
        reason: 'Nilai tangen tidak terdefinisi pada sudut 90° (dan kelipatan ganjilnya).',
      };
    }

    const rad = (deg * Math.PI) / 180;
    const rawTan = Math.tan(rad);
    const val = Math.abs(rawTan) < 1e-12 ? 0 : rawTan;

    let exactTex: string | null = null;
    if (Math.abs(deg - 0) < 1e-9) exactTex = '0';
    else if (Math.abs(deg - 30) < 1e-9) exactTex = '\\frac{1}{\\sqrt{3}} = \\frac{\\sqrt{3}}{3}';
    else if (Math.abs(deg - 45) < 1e-9) exactTex = '1';
    else if (Math.abs(deg - 60) < 1e-9) exactTex = '\\sqrt{3}';

    return {
      valid: true,
      deg,
      val,
      exactTex,
      formattedVal: val.toFixed(4).replace('.', ','),
    };
  }, [angleInput]);

  return (
    <section
      id="konsep"
      aria-labelledby="konsep-heading"
      className="py-12 border-t border-slate-200 scroll-mt-28"
    >
      <div className="max-w-3xl space-y-3 mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Bagian 01 · Memahami Konsep
        </p>
        <h2
          id="konsep-heading"
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance"
        >
          Bagaimana Detektif Mengukur Jarak Tanpa Turun Membawa Meteran?
        </h2>
<p className="text-slate-600 leading-relaxed">
  Sebelum memulai penyelidikan, coba bayangkan jika kalian berdiri di puncak menara pengawas pantai. Di bawah sana terlihat sebuah mobil atau kapal
  yang sedang berhenti. Kalian ingin mengetahui jarak benda tersebut dari kaki gedung atau
  menara, tetapi tidak mungkin turun dan membentangkan meteran hingga ke lokasi benda tersebut,
  bukan? Bagaimana cara memperkirakan jarak itu hanya dengan mengamati dari ketinggian?
</p>

<p className="text-slate-600 leading-relaxed">
  Dalam kehidupan sehari-hari, situasi seperti ini sering dijumpai, misalnya ketika petugas
  penyelamat memperkirakan posisi kapal dari tebing atau pengamat menentukan jarak kendaraan
  dari menara. Untuk menyelesaikan persoalan tersebut, kita perlu memahami situasi,
  mengidentifikasi informasi yang tersedia, dan menentukan strategi yang tepat. Di sinilah
  peran perbandingan trigonometri bekerja. Dengan mengetahui ketinggian posisi pengamat dan
  kemiringan arah pandang ke bawah yang disebut{' '}
  <strong className="font-semibold text-slate-900">sudut depresi</strong>, kita dapat
  memperkirakan jarak mendatar suatu objek.
</p>

<p className="text-slate-600 leading-relaxed">
  Melalui kegiatan ini, kalian akan berlatih membaca dan menafsirkan informasi, menghubungkan
  tinggi dan sudut dengan model segitiga siku-siku, serta menggunakan perbandingan trigonometri
  untuk melakukan perhitungan. Kalian juga akan mengeksplorasi perubahan sudut dan jarak melalui
  simulasi pada aplikasi ini. Perhatikan setiap informasi yang ditampilkan, amati
  hubungan antarbesaran, dan gunakan hasil pengamatan untuk membangun pemahaman.
</p>

<p className="text-slate-600 leading-relaxed">
  Bekerjalah bersama kelompok untuk menyelesaikan setiap tantangan dalam lembar kerja digital.
  Jangan hanya berfokus pada hasil akhir perhitungan. Kalian juga perlu menjelaskan informasi
  yang digunakan, alasan memilih cara penyelesaian, serta makna dari hasil yang diperoleh.
  Seorang pemecah masalah yang baik tidak hanya mampu menghitung, tetapi juga mampu memahami
  informasi, bernalar, dan mengambil kesimpulan berdasarkan bukti. Selamat menjalankan misi!
</p>
      </div>

      {/* Stand-alone Definition & Formula Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="border border-slate-200 rounded-xl p-6 bg-white flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Definisi Penting
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Apa Itu Sudut Depresi?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sudut depresi (<MathFormula tex="\theta" />) adalah sudut yang terbentuk antara{' '}
              <strong className="text-slate-800">garis pandang horizontal (mendatar)</strong> dari
              mata pengamat dengan{' '}
              <strong className="text-slate-800">garis pandang miring ke arah bawah</strong> menuju
              objek sasaran.
            </p>
          </div>
          <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
            Catatan kritis: Jangan mengukur sudut dari dinding menara yang vertikal, selalu ukur
            dari garis mendatar!
          </p>
        </div>

        <div className="border border-slate-200 rounded-xl p-6 bg-white flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Jembatan Geometri
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Sudut Dalam Berseberangan</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Garis pandang horizontal di atas sejajar dengan permukaan tanah di bawah. Akibatnya,
              besar sudut depresi <MathFormula tex="\theta" /> di posisi pengamat sama persis dengan
              sudut elevasi <MathFormula tex="\theta" /> jika dilihat dari titik objek di bawah.
            </p>
          </div>
          <p className="text-xs text-slate-500 pt-3 border-t border-slate-100">
            Hal ini membuat tinggi menara (<MathFormula tex="h" />) berada tepat di depan sudut{' '}
            <MathFormula tex="\theta" /> pada segitiga siku-siku.
          </p>
        </div>

        <div className="border border-blue-200 rounded-xl p-6 bg-blue-50/60 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Rumus Utama Misi
            </p>
            <h3 className="text-lg font-semibold text-slate-900">Perbandingan Tangen</h3>
            <div className="bg-white border border-blue-200 rounded-lg p-3.5 text-slate-900 space-y-2">
              <MathFormula
                block
                tex="\tan(\theta) = \frac{\text{sisi depan}}{\text{sisi samping}} = \frac{h}{d}"
              />
              <div className="text-blue-700 border-t border-blue-100 pt-1">
                <MathFormula block tex="d = \frac{h}{\tan(\theta)}" />
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Keterangan: <MathFormula tex="h" /> adalah tinggi pengamat dan{' '}
              <MathFormula tex="d" /> adalah jarak horizontal objek.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Right Triangle Side Explorer + Tangents Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div
          id="segitiga-siku"
          className="lg:col-span-7 border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-5 scroll-mt-28"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Eksplorasi Segitiga Siku-Siku
              </p>
              <h3 className="text-lg font-semibold text-slate-900 mt-0.5">
                Posisi Sisi Depan, Samping, dan Miring
              </h3>
            </div>

            <div
              role="group"
              aria-label="Pilih sudut acuan pada segitiga siku-siku"
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 shrink-0 self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => setSelectedAngle('A')}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedAngle === 'A'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudut A (∠A)
              </button>
              <button
                type="button"
                onClick={() => setSelectedAngle('C')}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  selectedAngle === 'C'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudut C (∠C)
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Pilih <strong className="text-slate-900">Sudut A</strong> atau{' '}
            <strong className="text-slate-900">Sudut C</strong> (atau klik langsung titik sudutnya
            pada gambar) untuk melihat bagaimana posisi sisi{' '}
            <span className="font-semibold text-blue-700">Depan</span> dan{' '}
            <span className="font-semibold text-emerald-700">Samping</span> bertukar tempat,
            sedangkan sisi <span className="font-semibold text-slate-900">Miring</span> selalu tetap
            berada di hadapan sudut siku-siku <MathFormula tex="B" />.
          </p>

          {/* Interactive SVG Right Triangle ABC (Right angle at B) */}
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 sm:p-4">
            <svg
              viewBox="0 0 460 275"
              className="w-full h-auto max-h-[250px] mx-auto select-none"
              role="img"
              aria-label={`Segitiga siku-siku ABC siku-siku di B dengan sudut acuan di ${selectedAngle}`}
            >
              {/* Subtle Blueprint Grid */}
              <defs>
                <pattern id="tri-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="0.6"
                  />
                </pattern>
              </defs>
              <rect x="0" y="0" width="460" height="275" fill="url(#tri-grid)" rx="8" />

              {/* Triangle Fill */}
              <polygon points="105,52 105,222 365,222" fill="#FFFFFF" fillOpacity="0.88" />

              {/* Right Angle Marker at B (105, 222) */}
              <polyline
                points="105,204 123,204 123,222"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Active Angle Sector Arc */}
              {selectedAngle === 'A' ? (
                <g>
                  {/* Angle at A (365, 222): horizontal left to hypotenuse up-left */}
                  <path
                    d="M 365 222 L 315 222 A 50 50 0 0 1 323.2 194.6 Z"
                    fill="#2563EB"
                    fillOpacity="0.18"
                  />
                  <path
                    d="M 315 222 A 50 50 0 0 1 323.2 194.6"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                  <text
                    x="294"
                    y="212"
                    fill="#1D4ED8"
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    θ
                  </text>
                </g>
              ) : (
                <g>
                  {/* Angle at C (105, 52): vertical down to hypotenuse down-right */}
                  <path
                    d="M 105 52 L 105 98 A 46 46 0 0 0 143.5 77.2 Z"
                    fill="#2563EB"
                    fillOpacity="0.18"
                  />
                  <path
                    d="M 105 98 A 46 46 0 0 0 143.5 77.2"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                  <text
                    x="114"
                    y="114"
                    fill="#1D4ED8"
                    fontSize="14"
                    fontWeight="700"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    θ
                  </text>
                </g>
              )}

              {/* Side BC (Vertical: x=105, y=52..222) -> Depan if A, Samping if C */}
              <line
                x1="105"
                y1="52"
                x2="105"
                y2="222"
                stroke={selectedAngle === 'A' ? '#2563EB' : '#059669'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Side AB (Horizontal: x=105..365, y=222) -> Samping if A, Depan if C */}
              <line
                x1="105"
                y1="222"
                x2="365"
                y2="222"
                stroke={selectedAngle === 'A' ? '#059669' : '#2563EB'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Side AC (Hypotenuse: 105,52 to 365,222) -> Always Miring */}
              <line
                x1="105"
                y1="52"
                x2="365"
                y2="222"
                stroke="#0F172A"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Dynamic Side Label: BC */}
              <g transform="translate(52, 137)">
                <rect
                  x="-42"
                  y="-16"
                  width="84"
                  height="32"
                  rx="6"
                  fill={selectedAngle === 'A' ? '#EFF6FF' : '#ECFDF5'}
                  stroke={selectedAngle === 'A' ? '#93C5FD' : '#6EE7B7'}
                />
                <text
                  x="0"
                  y="-1"
                  textAnchor="middle"
                  fill={selectedAngle === 'A' ? '#1D4ED8' : '#047857'}
                  fontSize="11.5"
                  fontWeight="700"
                >
                  {selectedAngle === 'A' ? 'Depan' : 'Samping'}
                </text>
                <text
                  x="0"
                  y="12"
                  textAnchor="middle"
                  fill="#475569"
                  fontSize="10.5"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  Sisi BC
                </text>
              </g>

              {/* Dynamic Side Label: AB */}
              <g transform="translate(235, 250)">
                <rect
                  x="-54"
                  y="-14"
                  width="108"
                  height="28"
                  rx="6"
                  fill={selectedAngle === 'A' ? '#ECFDF5' : '#EFF6FF'}
                  stroke={selectedAngle === 'A' ? '#6EE7B7' : '#93C5FD'}
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={selectedAngle === 'A' ? '#047857' : '#1D4ED8'}
                  fontSize="11.5"
                  fontWeight="700"
                >
                  {selectedAngle === 'A' ? 'Samping (AB)' : 'Depan (AB)'}
                </text>
              </g>

              {/* Fixed Side Label: AC (Miring) */}
              <g transform="translate(258, 122) rotate(33.18)">
                <rect
                  x="-52"
                  y="-24"
                  width="104"
                  height="24"
                  rx="6"
                  fill="#F1F5F9"
                  stroke="#CBD5E1"
                />
                <text
                  x="0"
                  y="-8"
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="11.5"
                  fontWeight="700"
                >
                  Miring (AC)
                </text>
              </g>

              {/* Vertex B (90 deg, fixed) */}
              <g>
                <circle cx="105" cy="222" r="5" fill="#475569" />
                <text
                  x="90"
                  y="243"
                  textAnchor="middle"
                  fill="#0F172A"
                  fontSize="14"
                  fontWeight="700"
                >
                  B (90°)
                </text>
              </g>

              {/* Clickable Vertex C */}
              <g
                onClick={() => setSelectedAngle('C')}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Pilih sudut C"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAngle('C');
                  }
                }}
              >
                <circle
                  cx="105"
                  cy="52"
                  r={selectedAngle === 'C' ? 11 : 8}
                  fill={selectedAngle === 'C' ? '#2563EB' : '#FFFFFF'}
                  fillOpacity={selectedAngle === 'C' ? 0.2 : 1}
                  stroke={selectedAngle === 'C' ? '#2563EB' : '#94A3B8'}
                  strokeWidth="2"
                />
                <circle
                  cx="105"
                  cy="52"
                  r="4.5"
                  fill={selectedAngle === 'C' ? '#2563EB' : '#475569'}
                />
                <text
                  x="105"
                  y="32"
                  textAnchor="middle"
                  fill={selectedAngle === 'C' ? '#1D4ED8' : '#0F172A'}
                  fontSize="15"
                  fontWeight="700"
                >
                  C{selectedAngle === 'C' ? ' (θ)' : ''}
                </text>
              </g>

              {/* Clickable Vertex A */}
              <g
                onClick={() => setSelectedAngle('A')}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label="Pilih sudut A"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedAngle('A');
                  }
                }}
              >
                <circle
                  cx="365"
                  cy="222"
                  r={selectedAngle === 'A' ? 11 : 8}
                  fill={selectedAngle === 'A' ? '#2563EB' : '#FFFFFF'}
                  fillOpacity={selectedAngle === 'A' ? 0.2 : 1}
                  stroke={selectedAngle === 'A' ? '#2563EB' : '#94A3B8'}
                  strokeWidth="2"
                />
                <circle
                  cx="365"
                  cy="222"
                  r="4.5"
                  fill={selectedAngle === 'A' ? '#2563EB' : '#475569'}
                />
                <text
                  x="385"
                  y="227"
                  textAnchor="start"
                  fill={selectedAngle === 'A' ? '#1D4ED8' : '#0F172A'}
                  fontSize="15"
                  fontWeight="700"
                >
                  A{selectedAngle === 'A' ? ' (θ)' : ''}
                </text>
              </g>
            </svg>
          </div>

          {/* Sin, Cos, Tan Formulas in Depan, Samping, Miring */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Perbandingan Trigonometri untuk Sudut {selectedAngle} (
                <MathFormula tex={`\\theta = \\angle ${selectedAngle}`} />)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-1">
                <p className="text-xs font-semibold text-slate-700">Sinus (sin)</p>
                <div className="text-sm text-slate-900">
                  <MathFormula
                    block
                    tex={`\\sin(${selectedAngle}) = \\frac{\\text{depan}}{\\text{miring}}`}
                  />
                </div>
                <div className="text-xs text-blue-700 border-t border-slate-200/80 pt-1">
                  <MathFormula
                    block
                    tex={
                      selectedAngle === 'A' ? '\\sin(A) = \\frac{BC}{AC}' : '\\sin(C) = \\frac{AB}{AC}'
                    }
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-1">
                <p className="text-xs font-semibold text-slate-700">Kosinus (cos)</p>
                <div className="text-sm text-slate-900">
                  <MathFormula
                    block
                    tex={`\\cos(${selectedAngle}) = \\frac{\\text{samping}}{\\text{miring}}`}
                  />
                </div>
                <div className="text-xs text-emerald-700 border-t border-slate-200/80 pt-1">
                  <MathFormula
                    block
                    tex={
                      selectedAngle === 'A' ? '\\cos(A) = \\frac{AB}{AC}' : '\\cos(C) = \\frac{BC}{AC}'
                    }
                  />
                </div>
              </div>

              <div className="border border-blue-200 rounded-lg p-3.5 bg-blue-50/60 space-y-1">
                <p className="text-xs font-semibold text-blue-800">Tangen (tan)</p>
                <div className="text-sm text-slate-900">
                  <MathFormula
                    block
                    tex={`\\tan(${selectedAngle}) = \\frac{\\text{depan}}{\\text{samping}}`}
                  />
                </div>
                <div className="text-xs text-blue-700 border-t border-blue-200/80 pt-1">
                  <MathFormula
                    block
                    tex={
                      selectedAngle === 'A' ? '\\tan(A) = \\frac{BC}{AB}' : '\\tan(C) = \\frac{AB}{BC}'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div
            id="kalkulator-tangen"
            className="border border-slate-200 rounded-xl p-6 bg-white space-y-4 scroll-mt-28"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Kalkulator Tangen</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan besar sudut (<MathFormula tex="\theta" />) dalam derajat untuk menghitung
                  nilai <MathFormula tex="\tan(\theta)" />.
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="tan-angle-input" className="block text-xs font-medium text-slate-700">
                Sudut (<MathFormula tex="\theta" />) dalam derajat
              </label>
              <div className="relative">
                <input
                  id="tan-angle-input"
                  type="text"
                  inputMode="decimal"
                  value={angleInput}
                  onChange={(e) => setAngleInput(e.target.value)}
                  placeholder="Contoh: 30 atau 53.5"
                  className="w-full min-h-[44px] pl-3.5 pr-16 py-2 font-mono text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
                  derajat
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[11px] font-medium text-slate-500">
                Sudut cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[30, 37, 45, 53, 60].map((presetDeg) => {
                  const isSelected = Number(angleInput.trim().replace(',', '.')) === presetDeg;
                  return (
                    <button
                      key={presetDeg}
                      type="button"
                      onClick={() => setAngleInput(String(presetDeg))}
                      className={`px-3 py-1.5 min-h-[36px] text-xs font-mono font-semibold rounded-md border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                      }`}
                    >
                      {presetDeg}°
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
                Hasil Perhitungan
              </p>
              {tanCalc.valid ? (
                <div className="space-y-1">
                  <div className="text-base sm:text-lg text-slate-900 tabular-nums">
                    <MathFormula
                      block
                      tex={
                        tanCalc.exactTex
                          ? `\\tan(${tanCalc.deg}^\\circ) = ${tanCalc.exactTex} \\approx ${tanCalc.formattedVal}`
                          : `\\tan(${tanCalc.deg}^\\circ) \\approx ${tanCalc.formattedVal}`
                      }
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 leading-relaxed">{tanCalc.reason}</p>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/70 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Aplikasi STEM Dunia Nyata</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Teknologi kamera drone pemetaan, sistem pendaratan pesawat, dan radar penjaga pantai
                semuanya mengonversi sudut miring kamera (gimbal pitch) menjadi jarak horizontal
                target secara otomatis menggunakan fungsi tangen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
