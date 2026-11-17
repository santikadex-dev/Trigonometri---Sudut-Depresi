import React, { useMemo, useState } from 'react';
import { Calculator, Compass, Info } from 'lucide-react';
import { MathFormula } from './MathFormula';

interface ConceptGuideSectionProps {
  onLoadExampleToSim: (heightM: number, angleDeg: number) => void;
}

export const ConceptGuideSection: React.FC<ConceptGuideSectionProps> = ({
  onLoadExampleToSim,
}) => {
  const [angleInput, setAngleInput] = useState<string>('30');

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
      className="py-12 border-t border-slate-200"
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
          Sebelum memulai penyelidikan, coba bayangkan jika kalian berdiri di balkon lantai empat
          sekolah atau di puncak menara pengawas pantai. Di bawah sana ada sebuah mobil atau kapal
          yang sedang berhenti. Tidak mungkin kalian turun dan membentangkan meteran melintasi laut,
          bukan?
        </p>
        <p className="text-slate-600 leading-relaxed">
          Di sinilah peran perbandingan trigonometri bekerja. Cukup dengan mengetahui ketinggian
          posisi pengamat dan kemiringan arah pandang ke bawah—yang disebut{' '}
          <strong className="font-semibold text-slate-900">sudut depresi</strong>—kalian bisa
          menghitung jarak mendatar benda tersebut secara akurat.
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

      {/* Interactive Example Walkthrough + Reference Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 border border-slate-200 rounded-xl p-6 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Contoh Terbimbing
              </p>
              <h3 className="text-lg font-semibold text-slate-900 mt-0.5">
                Mengamati Kapal dari Mercusuar 45 Meter
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onLoadExampleToSim(45, 30)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Uji di Simulasi</span>
            </button>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Mari kita amati situasi berikut: Seorang petugas di menara mercusuar setinggi{' '}
            <MathFormula tex="h = 45\text{ m}" /> melihat kapal kargo dengan sudut depresi{' '}
            <MathFormula tex="\theta = 30^\circ" />. Mengapa langkah pertama kita selalu mencari
            sudut di dalam segitiga bawah? Karena dengan sudut dalam berseberangan, kita langsung
            tahu sisi depan sudut <MathFormula tex="30^\circ" /> adalah tinggi menara{' '}
            <MathFormula tex="45\text{ m}" />.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 space-y-2.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Penyelesaian Langkah demi Langkah
            </p>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">Diketahui:</p>
              <MathFormula tex="h = 45\text{ m}, \quad \theta = 30^\circ" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                Langkah 1 — Susun perbandingan tangen pada segitiga siku-siku:
              </p>
              <MathFormula block tex="\tan(30^\circ) = \frac{h}{d} = \frac{45}{d}" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-600">
                Langkah 2 — Substitusikan nilai{' '}
                <MathFormula tex="\tan(30^\circ) = \frac{1}{\sqrt{3}} \approx 0{,}5774" />:
              </p>
              <div className="text-blue-700">
                <MathFormula
                  block
                  tex="d = \frac{45}{\tan(30^\circ)} = \frac{45}{\frac{1}{\sqrt{3}}} = 45\sqrt{3} \approx 77{,}94\text{ m}"
                />
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Sampai di sini, coba pikirkan: menurut kalian, apakah cara lain menggunakan sudut
            pelengkap <MathFormula tex="60^\circ" /> (antara dinding menara dan garis pandang) juga
            menghasilkan jarak yang sama? Ya! Karena{' '}
            <MathFormula tex="d = 45 \times \tan(60^\circ) = 45\sqrt{3}\text{ m}" />. Namun memahami
            definisi sudut depresi mencegah kita tertukar di lapangan!
          </p>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-4">
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
