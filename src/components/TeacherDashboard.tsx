import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  CheckCircle2,
  Download,
  Lock,
  Search,
  UserCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SubmissionRecord } from '../types/worksheet';

interface TeacherDashboardProps {
  user: User | null;
  isTeacher: boolean;
  submissions: SubmissionRecord[];
  loading: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  isTeacher,
  submissions,
  loading,
  onSignIn,
  onSignOut,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeStatusMsg, setGradeStatusMsg] = useState<string | null>(null);
  const [gradeErrorMsg, setGradeErrorMsg] = useState<string | null>(null);

  const availableClasses = useMemo(() => {
    const set = new Set(submissions.map((s) => s.studentClass));
    return ['ALL', ...Array.from(set).sort()];
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((s) => {
      if (classFilter !== 'ALL' && s.studentClass !== classFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (
        q &&
        !s.studentName.toLowerCase().includes(q) &&
        !s.studentNumber.toLowerCase().includes(q) &&
        !s.studentClass.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [submissions, classFilter, statusFilter, searchQuery]);

  const activeSubmission = useMemo(() => {
    if (!filteredSubmissions.length) return null;
    return filteredSubmissions.find((s) => s.id === selectedId) || filteredSubmissions[0];
  }, [filteredSubmissions, selectedId]);

  const selectSubmission = (sub: SubmissionRecord) => {
    setSelectedId(sub.id);
    setScoreInput(
      sub.status === 'graded' ? String(sub.teacherScore) : String(sub.autoScore)
    );
    setFeedbackInput(sub.teacherFeedback || '');
    setGradeStatusMsg(null);
    setGradeErrorMsg(null);
  };

  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.status === 'graded').length;
    const pending = total - graded;
    const avgAuto =
      total > 0
        ? Math.round(submissions.reduce((acc, s) => acc + s.autoScore, 0) / total)
        : 0;
    return { total, graded, pending, avgAuto };
  }, [submissions]);

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission || !user) return;
    const numericScore = Number(scoreInput);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      setGradeErrorMsg('Nilai guru harus berupa angka antara 0 hingga 100.');
      return;
    }

    setSavingGrade(true);
    setGradeErrorMsg(null);
    setGradeStatusMsg(null);

    const path = `submissions/${activeSubmission.id}`;
    try {
      await updateDoc(doc(db, 'submissions', activeSubmission.id), {
        status: 'graded',
        teacherScore: Math.round(numericScore),
        teacherFeedback: feedbackInput.trim().slice(0, 2000),
        gradedBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      setGradeStatusMsg('Penilaian berhasil disimpan.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setSavingGrade(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Nama',
      'Kelas',
      'Absen',
      'Email',
      'Skor Objektif',
      'Status',
      'Nilai Guru',
      'Catatan Guru',
      'Kasus A (m)',
      'Kasus B (m)',
      'Kasus C (m)',
      'AKM 2 Keputusan',
    ];
    const escapeCsv = (val: unknown) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = filteredSubmissions.map((s) =>
      [
        s.studentName,
        s.studentClass,
        s.studentNumber,
        s.studentEmail,
        `${s.autoScore}/${s.autoMaxScore}`,
        s.status === 'graded' ? 'Sudah Dinilai' : 'Menunggu',
        s.teacherScore,
        s.teacherFeedback,
        s.qCase1Distance,
        s.qCase2Gap,
        s.qCase3Answer,
        s.qHots2Decision,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hasil_misi_detektif_trigonometri.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!user || !isTeacher) {
    return (
      <section id="guru" className="py-12 border-t border-slate-200">
        <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-6 sm:p-8 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Panel Pemeriksaan Guru</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Halaman ini dikhususkan bagi guru pengampu untuk memeriksa seluruh hasil pekerjaan
            siswa, memberi nilai akhir, serta mengunduh rekap CSV.
          </p>
          {user ? (
            <div className="space-y-3 pt-2">
              <p className="text-xs text-slate-500">
                Saat ini masuk sebagai <strong className="text-slate-800">{user.email}</strong>{' '}
                (akun siswa).
              </p>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Keluar & Ganti Akun Guru
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Masuk dengan Akun Google Guru
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="guru" className="py-12 border-t border-slate-200 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Mode Guru · Pemeriksaan & Penilaian
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Rekap Hasil Worksheet Siswa
          </h2>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={filteredSubmissions.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Unduh Rekap CSV</span>
        </button>
      </div>

      {/* 4-Column Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <p className="text-xs text-slate-500">Total Worksheet Masuk</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {stats.total}
          </p>
        </div>
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <p className="text-xs text-slate-500">Menunggu Pemeriksaan</p>
          <p className="font-mono text-2xl font-bold text-blue-600 tabular-nums mt-1">
            {stats.pending}
          </p>
        </div>
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <p className="text-xs text-slate-500">Sudah Dinilai</p>
          <p className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {stats.graded}
          </p>
        </div>
        <div className="border border-slate-200 rounded-xl p-4 bg-white">
          <p className="text-xs text-slate-500">Rata-rata Skor Objektif</p>
          <p className="font-mono text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {stats.avgAuto}%
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama siswa, kelas, atau no. absen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <select
          aria-label="Filter kelas"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {availableClasses.map((cls) => (
            <option key={cls} value={cls}>
              {cls === 'ALL' ? 'Semua Kelas' : `Kelas ${cls}`}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'submitted', label: 'Menunggu' },
            { id: 'graded', label: 'Dinilai' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as 'all' | 'submitted' | 'graded')}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="border border-slate-200 rounded-xl p-10 bg-white flex items-center justify-center gap-3 text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span>Memuat kiriman worksheet siswa...</span>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="border border-slate-200 rounded-xl p-10 bg-white text-center space-y-2">
          <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-700">
            Belum ada hasil worksheet yang sesuai dengan filter.
          </p>
          <p className="text-xs text-slate-500">
            Hasil pekerjaan siswa yang dikirim akan langsung muncul di sini secara real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Student List */}
          <div className="lg:col-span-5 border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
            {filteredSubmissions.map((sub) => {
              const isSelected = activeSubmission?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => selectSubmission(sub)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {sub.studentName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      Kelas {sub.studentClass} · Absen {sub.studentNumber}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                      {sub.status === 'graded'
                        ? `Nilai: ${sub.teacherScore}`
                        : `Obj: ${sub.autoScore}/${sub.autoMaxScore}`}
                    </p>
                    <p
                      className={`text-[11px] font-medium ${
                        sub.status === 'graded' ? 'text-emerald-700' : 'text-blue-600'
                      }`}
                    >
                      {sub.status === 'graded' ? 'Sudah Dinilai' : 'Menunggu Nilai'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail & Grading Panel */}
          {activeSubmission && (
            <div className="lg:col-span-7 border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeSubmission.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kelas {activeSubmission.studentClass} · Absen {activeSubmission.studentNumber}{' '}
                    · {activeSubmission.studentEmail}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Skor Objektif Otomatis</p>
                  <p className="font-mono text-lg font-bold text-blue-700 tabular-nums">
                    {activeSubmission.autoScore} / {activeSubmission.autoMaxScore}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Eksplorasi Lab Virtual Terakhir
                  </p>
                  <p className="font-mono text-xs text-slate-600 tabular-nums">
                    h = {activeSubmission.simHeightM} m · θ = {activeSubmission.simAngleDeg}° · d ≈{' '}
                    {activeSubmission.simCalculatedDist} m
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Pemahaman Konsep (B/S & Alasan)
                  </p>
                  <p className="text-xs text-slate-600">
                    Soal 1: <strong>{activeSubmission.qConcept1 === 'false' ? 'Salah (Benar)' : activeSubmission.qConcept1 || '-'}</strong>{' '}
                    — {activeSubmission.qConcept1Reason || 'Tidak diisi'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Soal 2: <strong>{activeSubmission.qConcept2 === 'true' ? 'Benar (Tepat)' : activeSubmission.qConcept2 || '-'}</strong>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Kasus A (Mudah)</p>
                  <p className="font-mono text-xs text-slate-700 tabular-nums">
                    h = {activeSubmission.qCase1Height || '-'} m · θ ={' '}
                    {activeSubmission.qCase1Angle || '-'}° · d ={' '}
                    {activeSubmission.qCase1Distance || '-'} m
                  </p>
                  <p className="text-xs text-slate-600">
                    Langkah: {activeSubmission.qCase1Steps || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Kasus B (Sedang)</p>
                  <p className="font-mono text-xs text-slate-700 tabular-nums">
                    d_A = {activeSubmission.qCase2DistA || '-'} m · d_B ={' '}
                    {activeSubmission.qCase2DistB || '-'} m · Jarak A–B ={' '}
                    {activeSubmission.qCase2Gap || '-'} m
                  </p>
                  <p className="text-xs text-slate-600">
                    Penalaran: {activeSubmission.qCase2Steps || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Kasus C (Sulit — SAR)</p>
                  <p className="font-mono text-xs text-slate-700 tabular-nums">
                    Jarak tempuh perahu = {activeSubmission.qCase3Answer || '-'} m
                  </p>
                  <p className="text-xs text-slate-600">
                    Strategi: {activeSubmission.qCase3Strategy || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Evaluasi AKM 1 & 2</p>
                  <p className="text-xs text-slate-600">
                    AKM 1 (PG Kompleks):{' '}
                    <span className="font-mono">
                      {activeSubmission.qHots1Options.join(', ') || '-'}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600">
                    AKM 2 Keputusan: <strong>{activeSubmission.qHots2Decision || '-'}</strong> —{' '}
                    {activeSubmission.qHots2Reasoning || '-'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">
                    Refleksi & Keyakinan ({activeSubmission.confidenceLevel}/5)
                  </p>
                  <p className="text-xs text-slate-600">
                    {activeSubmission.reflectionText || '-'}
                  </p>
                </div>
              </div>

              {/* Grading Form */}
              <form
                onSubmit={handleSaveGrade}
                className="pt-4 border-t border-slate-200 space-y-4"
              >
                <h4 className="text-sm font-bold text-slate-900">Penilaian Guru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="teacher-score"
                      className="block text-xs font-medium text-slate-600"
                    >
                      Nilai Akhir (0–100)
                    </label>
                    <input
                      id="teacher-score"
                      type="number"
                      min={0}
                      max={100}
                      required
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 font-mono text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="teacher-feedback"
                      className="block text-xs font-medium text-slate-600"
                    >
                      Catatan Umpan Balik untuk Siswa
                    </label>
                    <input
                      id="teacher-feedback"
                      type="text"
                      maxLength={2000}
                      placeholder="Contoh: Langkah sudah sistematis, perhatikan pembulatan akar 3..."
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {gradeErrorMsg && (
                  <div className="flex items-center gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{gradeErrorMsg}</span>
                  </div>
                )}

                {gradeStatusMsg && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{gradeStatusMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingGrade}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                >
                  {savingGrade ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Nilai...</span>
                    </>
                  ) : (
                    <span>Simpan Penilaian</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
