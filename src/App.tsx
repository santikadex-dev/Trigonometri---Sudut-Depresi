import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { Compass, BookOpen, ClipboardList, UserCheck, ArrowRight } from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import {
  INITIAL_WORKSHEET_DRAFT,
  LabPresetId,
  SubmissionRecord,
  TEACHER_ADMIN_EMAIL,
  WorksheetDraft,
} from './types/worksheet';
import { evaluateObjectiveAnswers, sanitizeSubmissionPayload } from './utils/scoring';
import { TrigoLabSimulator } from './components/TrigoLabSimulator';
import { ConceptGuideSection } from './components/ConceptGuideSection';
import { WorksheetSection } from './components/WorksheetSection';
import { TeacherDashboard } from './components/TeacherDashboard';

const DRAFT_STORAGE_KEY = 'trigonometri_lab_draft_v1';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const [activeView, setActiveView] = useState<'student' | 'teacher'>('student');
  const [activePreset, setActivePreset] = useState<LabPresetId>('mercusuar');
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [draft, setDraft] = useState<WorksheetDraft>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const validClasses = ['X-A', 'X-B', 'X-C', 'X-D', 'X-E'];
        return {
          ...INITIAL_WORKSHEET_DRAFT,
          ...parsed,
          studentClass: validClasses.includes(parsed.studentClass)
            ? parsed.studentClass
            : INITIAL_WORKSHEET_DRAFT.studentClass,
        };
      }
    } catch {
      // Ignore storage parsing errors
    }
    return INITIAL_WORKSHEET_DRAFT;
  });

  const [mySubmissions, setMySubmissions] = useState<SubmissionRecord[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionRecord[]>([]);
  const [loadingTeacherData, setLoadingTeacherData] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Persist draft automatically in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage quota errors
    }
  }, [draft]);

  // Monitor Firebase Auth state & check teacher role
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsTeacher(false);
        setMySubmissions([]);
        setAllSubmissions([]);
        setAuthReady(true);
        return;
      }

      if (currentUser.displayName && !draft.studentName) {
        setDraft((prev) => ({
          ...prev,
          studentName: prev.studentName || currentUser.displayName || '',
        }));
      }

      let teacherRole =
        currentUser.email === TEACHER_ADMIN_EMAIL && currentUser.emailVerified;

      if (!teacherRole) {
        try {
          const teacherSnap = await getDoc(doc(db, 'teachers', currentUser.uid));
          if (teacherSnap.exists()) {
            teacherRole = true;
          }
        } catch {
          teacherRole = false;
        }
      }

      setIsTeacher(teacherRole);
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  // Listen to signed-in student's own submissions
  useEffect(() => {
    if (!authReady || !user) return;
    const path = 'submissions';
    const q = query(collection(db, path), where('studentUid', '==', user.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: SubmissionRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SubmissionRecord, 'id'>),
        }));
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis() ?? 0;
          const tb = b.createdAt?.toMillis() ?? 0;
          return tb - ta;
        });
        setMySubmissions(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // Listen to all submissions only when authorized as teacher
  useEffect(() => {
    if (!authReady || !user || !isTeacher) return;
    setLoadingTeacherData(true);
    const path = 'submissions';

    const unsub = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: SubmissionRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SubmissionRecord, 'id'>),
        }));
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis() ?? 0;
          const tb = b.createdAt?.toMillis() ?? 0;
          return tb - ta;
        });
        setAllSubmissions(list);
        setLoadingTeacherData(false);
      },
      (error) => {
        setLoadingTeacherData(false);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsub();
  }, [authReady, user, isTeacher]);

  const handleSignIn = async () => {
    setSubmitError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Gagal masuk dengan Google.';
      setSubmitError(`Proses masuk dibatalkan atau gagal: ${msg}`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveView('student');
  };

  const handleSimParamsChange = (heightM: number, angleDeg: number, distanceM: number) => {
    setDraft((prev) => ({
      ...prev,
      simHeightM: heightM,
      simAngleDeg: angleDeg,
      simCalculatedDist: distanceM,
    }));
  };

  const handleLoadCaseToSim = (heightM: number, angleDeg: number) => {
    setActiveView('student');
    setActivePreset('bebas');
    const rad = (angleDeg * Math.PI) / 180;
    const dist = Number((heightM / Math.tan(rad)).toFixed(2));
    handleSimParamsChange(heightM, angleDeg, dist);
    const el = document.getElementById('simulasi');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetDraft = () => {
    setDraft(INITIAL_WORKSHEET_DRAFT);
    setSubmitError(null);
    setSubmitSuccessMsg(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleSubmitWorksheet = async () => {
    let activeUser = user;
    if (!activeUser) {
      setSubmitError(null);
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        activeUser = cred.user;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Gagal masuk dengan Google.';
        setSubmitError(`Proses masuk dibatalkan atau gagal: ${msg}`);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccessMsg(null);

    const sanitized = sanitizeSubmissionPayload(draft);
    const evalResult = evaluateObjectiveAnswers(draft);
    const newDocRef = doc(collection(db, 'submissions'));
    const docPath = `submissions/${newDocRef.id}`;

    try {
      await setDoc(newDocRef, {
        ...sanitized,
        studentUid: activeUser.uid,
        studentEmail: activeUser.email || '',
        autoScore: evalResult.totalScore,
        autoMaxScore: evalResult.maxScore,
        status: 'submitted',
        teacherScore: 0,
        teacherFeedback: '',
        gradedBy: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSubmitSuccessMsg(
        'Berhasil! Worksheet kamu telah terkirim dan tersimpan untuk diperiksa oleh guru.'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToSection = (sectionId: string, view: 'student' | 'teacher' = 'student') => {
    setActiveView(view);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col pb-20 md:pb-0">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#pengantar"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('pengantar', 'student');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            TRIGONOMETRI LAB
          </a>

          {/* Zone 2: Concise 1-2 Word Nav Links */}
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() => navigateToSection('konsep', 'student')}
              className="hover:text-blue-600 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Konsep
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('simulasi', 'student')}
              className="hover:text-blue-600 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Simulasi
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('worksheet', 'student')}
              className="hover:text-blue-600 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Worksheet
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('guru', 'teacher')}
              className={`hover:text-blue-600 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'teacher' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Panel Guru
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Keluar ({user.displayName?.split(' ')[0] || 'Akun'})
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Masuk Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6">
        {activeView === 'teacher' ? (
          <TeacherDashboard
            user={user}
            isTeacher={isTeacher}
            submissions={allSubmissions}
            loading={loadingTeacherData}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
          />
        ) : (
          <>
            {/* Hero Section / Orientasi Misi */}
            <section id="pengantar" className="py-10 sm:py-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
                  <p className="text-xs sm:text-sm font-medium text-slate-500">
                    Matematika SMA Kelas X · SMAN Bali Mandara · Worksheet Digital Interaktif
                  </p>

                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 tracking-tight leading-[1.15] text-balance">
                    Misi Detektif Trigonometri: Mengukur Jarak dengan Sudut Depresi
                  </h1>

                  <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                    Jadilah detektif matematika! Eksplorasi laboratorium virtual, pahami alasan di
                    balik perbandingan tangen, dan pecahkan tiga kasus pengukuran jarak nyata
                    dari menara pantai hingga operasi Tim SAR.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => navigateToSection('simulasi', 'student')}
                      className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <span>Buka Simulasi Lab</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToSection('worksheet', 'student')}
                      className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span>Isi Worksheet</span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 flex">
                  <div className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-blue-50/40 flex items-center justify-center">
                    {!heroImgFailed ? (
                      <img
                        src="/src/assets/images/hero_detektif_trigonometri_1794813084892.jpg"
                        alt="Ilustrasi menara pengawas pantai mengamati kapal penelitian dengan garis pandang sudut depresi"
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImgFailed(true)}
                        className="w-full h-full object-cover min-h-[240px]"
                      />
                    ) : (
                      <div className="p-8 text-center space-y-2">
                        <Compass className="w-10 h-10 text-blue-600 mx-auto" />
                        <p className="text-sm font-semibold text-slate-800">
                          Misi Detektif Trigonometri
                        </p>
                        <p className="text-xs text-slate-500">
                          Menara Pengawas & Pengukuran Jarak dengan Sudut Depresi
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <ConceptGuideSection onLoadExampleToSim={handleLoadCaseToSim} />

            <TrigoLabSimulator
              heightM={draft.simHeightM}
              angleDeg={draft.simAngleDeg}
              onChangeParams={handleSimParamsChange}
              activePreset={activePreset}
              onSelectPreset={setActivePreset}
            />

            <WorksheetSection
              draft={draft}
              onChangeDraft={setDraft}
              onResetDraft={handleResetDraft}
              onLoadCaseToSim={handleLoadCaseToSim}
              onSubmitWorksheet={handleSubmitWorksheet}
              isSubmitting={isSubmitting}
              submitError={submitError}
              submitSuccessMsg={submitSuccessMsg}
              user={user}
              onSignIn={handleSignIn}
              mySubmissions={mySubmissions}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>TRIGONOMETRI LAB · I Kadek Santika</span>
          <button
            type="button"
            onClick={() =>
              navigateToSection(
                activeView === 'teacher' ? 'pengantar' : 'guru',
                activeView === 'teacher' ? 'student' : 'teacher'
              )
            }
            className="text-blue-600 font-medium hover:underline cursor-pointer"
          >
            {activeView === 'teacher'
              ? 'Kembali ke Halaman Siswa'
              : 'Buka Panel Pemeriksaan Guru'}
          </button>
        </div>
      </footer>

      {/* Mobile Bottom Thumb-Zone Navigation (<= 15% sticky height) */}
      <nav
        aria-label="Navigasi cepat mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-4 h-16"
      >
        <button
          type="button"
          onClick={() => navigateToSection('konsep', 'student')}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px] font-medium">Konsep</span>
        </button>
        <button
          type="button"
          onClick={() => navigateToSection('simulasi', 'student')}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[11px] font-medium">Simulasi</span>
        </button>
        <button
          type="button"
          onClick={() => navigateToSection('worksheet', 'student')}
          className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[11px] font-medium">Worksheet</span>
        </button>
        <button
          type="button"
          onClick={() => navigateToSection('guru', 'teacher')}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeView === 'teacher' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[11px] font-medium">Guru</span>
        </button>
      </nav>
    </div>
  );
}
