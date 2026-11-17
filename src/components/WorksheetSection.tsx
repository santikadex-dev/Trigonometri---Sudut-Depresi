import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Compass,
  HelpCircle,
  Send,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { SubmissionRecord, WorksheetDraft } from '../types/worksheet';
import { AutoEvaluationResult, evaluateObjectiveAnswers } from '../utils/scoring';
import { MathFormula } from './MathFormula';

interface WorksheetSectionProps {
  draft: WorksheetDraft;
  onChangeDraft: (updater: (prev: WorksheetDraft) => WorksheetDraft) => void;
  onResetDraft: () => void;
  onLoadCaseToSim: (heightM: number, angleDeg: number) => void;
  onSubmitWorksheet: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccessMsg: string | null;
  user: User | null;
  onSignIn: () => Promise<void>;
  mySubmissions: SubmissionRecord[];
}

const HOTS1_STATEMENTS: { id: string; content: React.ReactNode }[] = [
  {
    id: 'A',
    content: (
      <>
        Sudut elevasi dari pelampung ke puncak tebing adalah <MathFormula tex="35^\circ" />.
      </>
    ),
  },
  {
    id: 'B',
    content: (
      <>
        Sudut depresi sebenarnya yang diukur dari garis mendatar adalah{' '}
        <MathFormula tex="55^\circ" />.
      </>
    ),
  },
  {
    id: 'C',
    content: (
      <>
        Jarak horizontal pelampung ke kaki tebing seharusnya dihitung dengan{' '}
        <MathFormula tex="\frac{40}{\tan(55^\circ)}" />.
      </>
    ),
  },
  {
    id: 'D',
    content: 'Semakin besar sudut depresi, semakin jauh jarak benda dari kaki tebing.',
  },
];

export const WorksheetSection: React.FC<WorksheetSectionProps> = ({
  draft,
  onChangeDraft,
  onResetDraft,
  onLoadCaseToSim,
  onSubmitWorksheet,
  isSubmitting,
  submitError,
  submitSuccessMsg,
  user,
  onSignIn,
  mySubmissions,
}) => {
  const [showAutoCheck, setShowAutoCheck] = useState(false);
  const [openHints, setOpenHints] = useState<number[]>([]);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const autoEval: AutoEvaluationResult = useMemo(
    () => evaluateObjectiveAnswers(draft),
    [draft]
  );

  const completionStats = useMemo(() => {
    const checks = [
      draft.studentName.trim().length >= 2,
      draft.studentClass.trim().length >= 1,
      draft.studentNumber.trim().length >= 1,
      draft.qConcept1 !== '',
      draft.qConcept2 !== '',
      draft.qCase1Distance.trim() !== '',
      draft.qCase2Gap.trim() !== '',
      draft.qCase3Answer.trim() !== '',
      draft.qHots1Options.length > 0,
      draft.qHots2Decision !== '',
      draft.reflectionText.trim().length >= 5,
    ];
    const done = checks.filter(Boolean).length;
    return { done, total: checks.length };
  }, [draft]);

  const updateField = <K extends keyof WorksheetDraft>(field: K, value: WorksheetDraft[K]) => {
    setValidationWarning(null);
    onChangeDraft((prev) => ({ ...prev, [field]: value }));
  };

  const toggleHots1Option = (optId: string) => {
    onChangeDraft((prev) => {
      const exists = prev.qHots1Options.includes(optId);
      const next = exists
        ? prev.qHots1Options.filter((id) => id !== optId)
        : [...prev.qHots1Options, optId].slice(0, 4);
      return { ...prev, qHots1Options: next };
    });
  };

  const toggleHint = (step: number) => {
    setOpenHints((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  };

  const handleSubmitClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.studentName.trim().length < 2) {
      setValidationWarning('Mohon isi Nama Lengkap minimal 2 huruf sebelum mengirim.');
      return;
    }
    if (!draft.studentClass.trim() || !draft.studentNumber.trim()) {
      setValidationWarning('Mohon lengkapi Kelas dan Nomor Absen / Kelompok terlebih dahulu.');
      return;
    }
    setValidationWarning(null);
    await onSubmitWorksheet();
  };

  return (
    <section
      id="worksheet"
      aria-labelledby="worksheet-heading"
      className="py-12 border-t border-slate-200"
    >
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Bagian 03 · Lembar Kerja Digital Siswa
          </p>
          <h2
            id="worksheet-heading"
            className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance"
          >
            Penyelidikan Misi Detektif & Evaluasi AKM
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Isi identitas, selesaikan 3 kasus berjenjang, dan kirimkan hasil penyelidikanmu agar
            dapat diperiksa oleh guru. Jawabanmu tersimpan otomatis sebagai draf di perangkat ini.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-slate-500">Progres Pengisian</p>
            <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
              {completionStats.done} / {completionStats.total} bagian
            </p>
          </div>
          <button
            type="button"
            onClick={onResetDraft}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Draf</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitClick} className="space-y-10">
        {/* Identitas Siswa */}
        <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">01. Identitas Detektif</h3>
            {user && (
              <span className="text-xs text-slate-500">
                Terhubung sebagai <strong className="text-slate-800">{user.email}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="student-name" className="block text-sm font-medium text-slate-700">
                Nama Lengkap <span className="text-rose-600">*</span>
              </label>
              <input
                id="student-name"
                type="text"
                required
                maxLength={120}
                placeholder="Contoh: Nadira Putri"
                value={draft.studentName}
                onChange={(e) => updateField('studentName', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="student-class" className="block text-sm font-medium text-slate-700">
                Kelas <span className="text-rose-600">*</span>
              </label>
              <select
                id="student-class"
                value={
                  ['X-A', 'X-B', 'X-C', 'X-D', 'X-E'].includes(draft.studentClass)
                    ? draft.studentClass
                    : 'X-A'
                }
                onChange={(e) => updateField('studentClass', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {['X-A', 'X-B', 'X-C', 'X-D', 'X-E'].map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="student-number" className="block text-sm font-medium text-slate-700">
                No. Absen / Kelompok <span className="text-rose-600">*</span>
              </label>
              <input
                id="student-number"
                type="text"
                required
                maxLength={20}
                placeholder="Contoh: 14 / Kel. 3"
                value={draft.studentNumber}
                onChange={(e) => updateField('studentNumber', e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Bagian 1: Cek Konsep & Miskonsepsi */}
        <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Tahap 1 · Cek Pemahaman Dasar
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Deteksi Miskonsepsi Sudut Depresi
            </h3>
            <p className="text-sm text-slate-600">
              Sebelum menghitung kasus lapangan, pastikan kalian tidak terjebak kekeliruan yang
              sering terjadi pada pengukuran sudut.
            </p>
          </div>

          <div className="space-y-5 divide-y divide-slate-100">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                1. Pernyataan: &ldquo;Jika seorang pengamat berdiri di puncak gedung dan melihat
                mobil di jalan raya, maka sudut depresi diukur antara dinding vertikal gedung
                dengan garis pandang mata.&rdquo;
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { val: 'true', label: 'Benar' },
                  { val: 'false', label: 'Salah' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateField('qConcept1', opt.val)}
                    className={`px-5 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                      draft.qConcept1 === opt.val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="concept1-reason"
                  className="block text-xs font-medium text-slate-600"
                >
                  Jelaskan alasan singkatmu:
                </label>
                <input
                  id="concept1-reason"
                  type="text"
                  maxLength={1000}
                  placeholder="Tuliskan mengapa pernyataan tersebut benar atau salah..."
                  value={draft.qConcept1Reason}
                  onChange={(e) => updateField('qConcept1Reason', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="pt-5 space-y-3">
              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                2. Pernyataan: &ldquo;Besar sudut depresi dari puncak menara ke sebuah kapal sama
                besar dengan sudut elevasi dari kapal tersebut ke puncak menara.&rdquo;
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { val: 'true', label: 'Benar' },
                  { val: 'false', label: 'Salah' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateField('qConcept2', opt.val)}
                    className={`px-5 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                      draft.qConcept2 === opt.val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 2: 3 Kasus Berdiferensiasi */}
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Tahap 2 · Penyelidikan Berjenjang
            </p>
            <h3 className="text-xl font-bold text-slate-900">Tiga Kasus Lapangan Detektif</h3>
            <p className="text-sm text-slate-600">
              Selesaikan ketiga kasus berikut dari tingkat dasar hingga analisis STEM terbuka. Jangan
              khawatir jika Kasus C terasa menantang—manfaatkan petunjuk berpikir yang tersedia.
            </p>
          </div>

          {/* Kasus A: Mudah */}
          <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Kasus A · ★ Mudah · Pemahaman Prosedural
                </p>
                <h4 className="text-lg font-semibold text-slate-900 mt-0.5">
                  Menara Pengawas Pantai
                </h4>
              </div>
              <button
                type="button"
                onClick={() => onLoadCaseToSim(30, 45)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Coba di Simulasi (30 m, 45°)</span>
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              Dari ruang pantau menara pantai setinggi{' '}
              <span className="font-mono font-semibold">30 m</span> di atas permukaan laut, seorang
              petugas mengamati sebuah perahu wisata dengan sudut depresi{' '}
              <span className="font-mono font-semibold">45°</span>. Tentukan jarak mendatar perahu
              tersebut dari kaki menara.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="case1-h" className="block text-xs font-medium text-slate-600">
                  Tinggi Menara h (meter)
                </label>
                <input
                  id="case1-h"
                  type="text"
                  inputMode="decimal"
                  maxLength={50}
                  placeholder="Contoh: 60"
                  value={draft.qCase1Height}
                  onChange={(e) => updateField('qCase1Height', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="case1-a" className="block text-xs font-medium text-slate-600">
                  Sudut Depresi θ (derajat)
                </label>
                <input
                  id="case1-a"
                  type="text"
                  inputMode="decimal"
                  maxLength={50}
                  placeholder="Contoh: 45"
                  value={draft.qCase1Angle}
                  onChange={(e) => updateField('qCase1Angle', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="case1-d" className="block text-xs font-medium text-slate-600">
                  Jarak Horizontal d (meter)
                </label>
                <input
                  id="case1-d"
                  type="text"
                  inputMode="decimal"
                  maxLength={50}
                  placeholder="Hasil perhitungan (m)"
                  value={draft.qCase1Distance}
                  onChange={(e) => updateField('qCase1Distance', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="case1-steps" className="block text-xs font-medium text-slate-600">
                Tuliskan langkah perhitunganmu (mengapa rumus tersebut digunakan):
              </label>
              <textarea
                id="case1-steps"
                rows={2}
                maxLength={2000}
                placeholder="Contoh: Karena tan(45°) = h / d = 1, maka d = 60 / 1 = 60 m..."
                value={draft.qCase1Steps}
                onChange={(e) => updateField('qCase1Steps', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Kasus B: Sedang */}
          <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Kasus B · ★★ Sedang · Penerapan Dua Segitiga
              </p>
              <h4 className="text-lg font-semibold text-slate-900 mt-0.5">
                Drone Pemantau Lalu Lintas Jalan Tol
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-6 space-y-2.5">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Sebuah drone patroli melayang stabil pada ketinggian{' '}
                  <span className="font-mono font-semibold">50 m</span> tepat di atas garis lurus
                  jalan tol. Pada arah yang sama di depan drone, kamera mendeteksi{' '}
                  <strong className="text-slate-900">Mobil A</strong> dengan sudut depresi{' '}
                  <span className="font-mono font-semibold">60°</span> dan{' '}
                  <strong className="text-slate-900">Mobil B</strong> dengan sudut depresi{' '}
                  <span className="font-mono font-semibold">30°</span>.
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Gunakan <MathFormula tex="\sqrt{3} \approx 1{,}732" /> untuk menghitung jarak
                  antara Mobil A dan Mobil B!
                </p>
              </div>

              <div className="md:col-span-6 bg-[#F8FAFC] border border-slate-200 rounded-lg p-3">
                <svg
                  viewBox="0 0 420 180"
                  className="w-full h-auto"
                  role="img"
                  aria-label="Diagram Drone pada ketinggian 50 meter mengamati Mobil A dengan sudut depresi 60 derajat dan Mobil B dengan sudut depresi 30 derajat"
                >
                  <line x1="20" y1="150" x2="400" y2="150" stroke="#64748B" strokeWidth="2" />
                  <line
                    x1="60"
                    y1="32"
                    x2="60"
                    y2="150"
                    stroke="#94A3B8"
                    strokeWidth="1.8"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="60"
                    y1="32"
                    x2="380"
                    y2="32"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  {/* Sightlines */}
                  <line x1="60" y1="32" x2="155" y2="150" stroke="#1E293B" strokeWidth="2" />
                  <line x1="60" y1="32" x2="345" y2="150" stroke="#0284C7" strokeWidth="2" />
                  {/* Drone */}
                  <rect x="46" y="25" width="28" height="10" rx="3" fill="#1E293B" />
                  <text x="60" y="18" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1E293B">
                    Drone (50 m)
                  </text>
                  {/* Angles */}
                  <text x="128" y="47" fontSize="10" fontWeight="600" fill="#0284C7" fontFamily="IBM Plex Mono, monospace">
                    30°
                  </text>
                  <text x="86" y="57" fontSize="10" fontWeight="600" fill="#1E293B" fontFamily="IBM Plex Mono, monospace">
                    60°
                  </text>
                  {/* Cars */}
                  <rect x="143" y="140" width="24" height="10" rx="2" fill="#2563EB" />
                  <text x="155" y="166" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#1E293B">
                    Mobil A
                  </text>
                  <rect x="333" y="140" width="24" height="10" rx="2" fill="#0284C7" />
                  <text x="345" y="166" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#1E293B">
                    Mobil B
                  </text>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="case2-a" className="block text-xs font-medium text-slate-600">
                  Jarak ke Mobil A (<MathFormula tex="d_A" /> dalam m)
                </label>
                <input
                  id="case2-a"
                  type="text"
                  maxLength={50}
                  placeholder="Contoh: 28.9 atau 50/√3"
                  value={draft.qCase2DistA}
                  onChange={(e) => updateField('qCase2DistA', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="case2-b" className="block text-xs font-medium text-slate-600">
                  Jarak ke Mobil B (<MathFormula tex="d_B" /> dalam m)
                </label>
                <input
                  id="case2-b"
                  type="text"
                  maxLength={50}
                  placeholder="Contoh: 86.6 atau 50√3"
                  value={draft.qCase2DistB}
                  onChange={(e) => updateField('qCase2DistB', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="case2-gap" className="block text-xs font-medium text-slate-600">
                  Jarak Mobil A ke B (m)
                </label>
                <input
                  id="case2-gap"
                  type="text"
                  maxLength={50}
                  placeholder="Selisih d_B - d_A"
                  value={draft.qCase2Gap}
                  onChange={(e) => updateField('qCase2Gap', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="case2-steps" className="block text-xs font-medium text-slate-600">
                Uraikan penalaran dan perhitunganmu:
              </label>
              <textarea
                id="case2-steps"
                rows={2}
                maxLength={2000}
                placeholder="Mengapa posisi Mobil A lebih dekat ke titik tepat di bawah drone daripada Mobil B?"
                value={draft.qCase2Steps}
                onChange={(e) => updateField('qCase2Steps', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Kasus C: Sulit + Scaffolding */}
          <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-5">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Kasus C · ★★★ Sulit · HOTS & Pemodelan STEM
              </p>
              <h4 className="text-lg font-semibold text-slate-900 mt-0.5">
                Operasi Penyelamatan Tebing Tim SAR
              </h4>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              Pos pantau Tim SAR berada di atas tebing setinggi{' '}
              <span className="font-mono font-semibold">60 m</span> di atas permukaan air laut.
              Sebuah perahu karet bergerak lurus mendekati kaki tebing dengan kecepatan konstan.
              Petugas mencatat sudut depresi perahu pada dua waktu berbeda seperti pada tabel
              pengamatan berikut:
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Waktu Pengamatan</th>
                    <th className="py-2.5 px-4 font-semibold">Sudut Depresi (θ)</th>
                    <th className="py-2.5 px-4 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs sm:text-sm tabular-nums">
                  <tr>
                    <td className="py-2.5 px-4">t = 0 detik</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">30°</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      Posisi awal perahu di laut lepas
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4">t = 20 detik</td>
                    <td className="py-2.5 px-4 font-semibold text-blue-700">60°</td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      Perahu bergerak lurus mendekati tebing
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scaffolding Petunjuk Berpikir */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Petunjuk Berpikir Bertahap (Buka jika butuh arahan)</span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    step: 1,
                    title: 'Petunjuk 1: Bangun dua kondisi posisi perahu',
                    body: (
                      <>
                        Bayangkan ada dua segitiga siku-siku dengan tinggi tebing yang sama (
                        <MathFormula tex="h = 60\text{ m}" />). Saat <MathFormula tex="t = 0" />{' '}
                        detik sudutnya <MathFormula tex="30^\circ" />, dan saat{' '}
                        <MathFormula tex="t = 20" /> detik sudutnya <MathFormula tex="60^\circ" />.
                      </>
                    ),
                  },
                  {
                    step: 2,
                    title: 'Petunjuk 2: Hitung jarak masing-masing posisi dari kaki tebing',
                    body: (
                      <>
                        Hitung <MathFormula tex="d_1 = \frac{60}{\tan(30^\circ)}" /> dan{' '}
                        <MathFormula tex="d_2 = \frac{60}{\tan(60^\circ)}" />. Gunakan{' '}
                        <MathFormula tex="\sqrt{3} \approx 1{,}732" />.
                      </>
                    ),
                  },
                  {
                    step: 3,
                    title: 'Petunjuk 3: Tentukan jarak tempuh perahu',
                    body: (
                      <>
                        Jarak yang ditempuh perahu selama 20 detik adalah selisih posisi awal dan
                        posisi akhir: <MathFormula tex="\Delta d = d_1 - d_2" />.
                      </>
                    ),
                  },
                ].map((hint) => {
                  const isOpen = openHints.includes(hint.step);
                  return (
                    <div key={hint.step} className="bg-white border border-blue-200/80 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleHint(hint.step)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <span>{hint.title}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="px-3.5 pb-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-2">
                          {hint.body}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4 space-y-1.5">
                <label htmlFor="case3-ans" className="block text-xs font-medium text-slate-600">
                  Jarak yang Ditempuh Perahu (meter)
                </label>
                <input
                  id="case3-ans"
                  type="text"
                  maxLength={50}
                  placeholder="Contoh: 69.3 atau 40√3"
                  value={draft.qCase3Answer}
                  onChange={(e) => updateField('qCase3Answer', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="md:col-span-8 space-y-1.5">
                <label htmlFor="case3-strat" className="block text-xs font-medium text-slate-600">
                  Strategi penyelesaian & kesimpulan kecepatan perahu (m/s):
                </label>
                <textarea
                  id="case3-strat"
                  rows={2}
                  maxLength={2500}
                  placeholder="Jelaskan cara menghitung d₁, d₂, jarak tempuh Δd, serta kecepatan perahu jika dibagi 20 detik..."
                  value={draft.qCase3Strategy}
                  onChange={(e) => updateField('qCase3Strategy', e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 3: Evaluasi AKM / HOTS & Refleksi */}
        <div
          id="evaluasi"
          className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-7"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Tahap 3 · Evaluasi AKM & Refleksi
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Tantangan Penalaran & Pengambilan Keputusan
            </h3>
          </div>

          {/* AKM 1: Pilihan Ganda Kompleks */}
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              Soal AKM 1 · Pilihan Ganda Kompleks (Pilih lebih dari satu pernyataan yang benar)
            </p>
            <p className="text-sm text-slate-800 leading-relaxed">
              Budi berdiri di tepi tebing setinggi <MathFormula tex="40\text{ m}" /> untuk mengukur
              jarak pelampung di laut. Ia mengarahkan klinometer dan mencatat sudut{' '}
              <strong className="text-slate-900">
                <MathFormula tex="35^\circ" /> terhadap dinding tebing vertikal
              </strong>
              , lalu langsung menuliskan <MathFormula tex="d = \frac{40}{\tan(35^\circ)}" />.
              Manakah pernyataan evaluasi yang benar mengenai pekerjaan Budi?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {HOTS1_STATEMENTS.map((stmt) => {
                const checked = draft.qHots1Options.includes(stmt.id);
                return (
                  <button
                    key={stmt.id}
                    type="button"
                    onClick={() => toggleHots1Option(stmt.id)}
                    className={`flex items-start gap-3 p-3.5 min-h-[52px] text-left rounded-lg border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-blue-50 border-blue-600 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0 border ${
                        checked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-500 border-slate-300'
                      }`}
                    >
                      {stmt.id}
                    </span>
                    <span className="text-sm leading-snug">{stmt.content}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AKM 2: Pengambilan Keputusan Berbasis Data */}
          <div className="space-y-4 pb-6 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500">
              Soal AKM 2 · Studi Kasus Pengambilan Keputusan
            </p>
            <p className="text-sm text-slate-800 leading-relaxed">
              Zona terumbu karang berbahaya membentang hingga jarak{' '}
              <MathFormula tex="45\text{ m}" /> dari kaki pos pemantau pantai (tinggi pos{' '}
              <MathFormula tex="40\text{ m}" />). Kapal dinyatakan{' '}
              <strong className="text-slate-900">Aman</strong> jika jaraknya lebih dari{' '}
              <MathFormula tex="45\text{ m}" />, dan{' '}
              <strong className="text-slate-900">Berbahaya</strong> jika jaraknya kurang dari atau
              sama dengan <MathFormula tex="45\text{ m}" />. Petugas melihat sebuah kapal pada
              sudut depresi <MathFormula tex="53^\circ" /> (diketahui{' '}
              <MathFormula tex="\tan(53^\circ) \approx \frac{4}{3}" />). Bagaimana keputusanmu?
            </p>

            <div className="flex flex-wrap gap-3">
              {['Aman', 'Berbahaya'].map((decision) => (
                <button
                  key={decision}
                  type="button"
                  onClick={() => updateField('qHots2Decision', decision)}
                  className={`px-5 py-2.5 min-h-[44px] text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                    draft.qHots2Decision === decision
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  Status: {decision}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="hots2-reason" className="block text-xs font-medium text-slate-600">
                Tuliskan bukti perhitungan matematis yang mendasari keputusanmu:
              </label>
              <textarea
                id="hots2-reason"
                rows={2}
                maxLength={2000}
                placeholder="Tunjukkan perhitungan jarak horizontal kapal lalu bandingkan dengan batas karang 45 m..."
                value={draft.qHots2Reasoning}
                onChange={(e) => updateField('qHots2Reasoning', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Refleksi Diri */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-slate-900">Refleksi Diri Detektif</h4>
            <div className="space-y-1.5">
              <label htmlFor="reflection-text" className="block text-sm text-slate-700">
                Apa konsep terpenting yang kamu pelajari hari ini, dan bagian mana yang paling
                sering membuat orang keliru saat mengukur sudut depresi?
              </label>
              <textarea
                id="reflection-text"
                rows={3}
                maxLength={2000}
                placeholder="Tuliskan refleksi belajarmu dengan bahasamu sendiri..."
                value={draft.reflectionText}
                onChange={(e) => updateField('reflectionText', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-slate-600">
                Tingkat keyakinanmu memahami materi Sudut Depresi (1 = Masih bingung, 5 = Sangat
                paham):
              </span>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateField('confidenceLevel', lvl)}
                    className={`min-w-[48px] min-h-[44px] px-3 text-sm font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                      draft.confidenceLevel === lvl
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Check Preview Drawer */}
        {showAutoCheck && (
          <div className="border border-blue-200 rounded-xl p-5 sm:p-6 bg-blue-50/50 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-slate-900">
                  Hasil Pemeriksaan Jawaban Objektif Sementara
                </h4>
                <p className="text-xs text-slate-600">
                  Catatan: Jawaban uraian/strategi akan diperiksa dan diberi nilai akhir oleh guru.
                </p>
              </div>
              <p className="font-mono text-lg font-bold text-blue-700 tabular-nums">
                Skor Objektif: {autoEval.totalScore} / {autoEval.maxScore}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {autoEval.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                    <span
                      className={`text-xs font-mono font-semibold tabular-nums ${
                        item.isCorrect ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {item.isCorrect ? 'Benar' : 'Perlu Cek'} ({item.earnedPoints}/{item.maxPoints})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings / Errors / Success Banners */}
        {validationWarning && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <span>{validationWarning}</span>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {submitSuccessMsg && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{submitSuccessMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowAutoCheck((v) => !v)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            <span>
              {showAutoCheck ? 'Sembunyikan Cek Jawaban' : 'Periksa Jawaban Objektif'}
            </span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Guru...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {user ? 'Kirim Worksheet ke Guru' : 'Masuk Google & Kirim ke Guru'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Riwayat Pengiriman Siswa (jika sudah login & pernah mengirim) */}
      {user && mySubmissions.length > 0 && (
        <div className="mt-10 pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Riwayat Worksheet Terkirim & Umpan Balik Guru
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="border border-slate-200 rounded-xl p-5 bg-white space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {sub.studentName} · Kelas {sub.studentClass}
                    </p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      Absen: {sub.studentNumber} · Skor Objektif: {sub.autoScore}/{sub.autoMaxScore}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      sub.status === 'graded' ? 'text-emerald-700' : 'text-blue-700'
                    }`}
                  >
                    {sub.status === 'graded' ? 'Sudah Dinilai' : 'Menunggu Guru'}
                  </span>
                </div>

                {sub.status === 'graded' ? (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 space-y-1">
                    <p className="font-mono text-sm font-bold text-blue-800 tabular-nums">
                      Nilai Akhir Guru: {sub.teacherScore} / 100
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {sub.teacherFeedback || 'Tidak ada catatan tambahan.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Worksheet telah diterima oleh sistem. Nilai akhir akan tampil di sini setelah
                    diperiksa guru.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
