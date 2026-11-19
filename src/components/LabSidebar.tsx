import React, { useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Compass,
  Flag,
  PanelLeftClose,
  UserCheck,
  X,
} from 'lucide-react';

export interface LabNavSubItem {
  id: string;
  label: string;
}

export interface LabNavSection {
  id: 'pengantar' | 'konsep' | 'simulasi' | 'worksheet';
  stepLabel: string;
  shortTitle: string;
  fullTitle: string;
  children?: LabNavSubItem[];
}

export const LAB_NAV_SECTIONS: LabNavSection[] = [
  {
    id: 'pengantar',
    stepLabel: 'ORIENTASI',
    shortTitle: 'Pengantar Misi',
    fullTitle: 'Misi Detektif Trigonometri',
  },
  {
    id: 'konsep',
    stepLabel: 'BAGIAN 01',
    shortTitle: 'Memahami Konsep',
    fullTitle: 'Memahami Konsep Sudut Depresi',
    children: [
      { id: 'contoh-terbimbing', label: 'Contoh Terbimbing' },
      { id: 'kalkulator-tangen', label: 'Kalkulator Tangen' },
    ],
  },
  {
    id: 'simulasi',
    stepLabel: 'BAGIAN 02',
    shortTitle: 'Simulasi Lab',
    fullTitle: 'Simulasi Sudut Depresi & Jarak Horizontal',
  },
  {
    id: 'worksheet',
    stepLabel: 'BAGIAN 03',
    shortTitle: 'Worksheet Siswa',
    fullTitle: 'Penyelidikan Misi & Evaluasi AKM',
    children: [
      { id: 'identitas-siswa', label: 'Identitas Detektif' },
      { id: 'cek-konsep', label: 'Tahap 1 · Cek Konsep' },
      { id: 'kasus-lapangan', label: 'Tahap 2 · Tiga Kasus' },
      { id: 'evaluasi', label: 'Tahap 3 · Evaluasi AKM' },
    ],
  },
];

interface LabSidebarProps {
  open: boolean;
  onClose: () => void;
  activeMainId: string;
  activeSubId: string;
  activeView: 'student' | 'teacher';
  onJumpToSection: (sectionId: string, view?: 'student' | 'teacher') => void;
}

const getSectionIcon = (id: LabNavSection['id']) => {
  switch (id) {
    case 'pengantar':
      return Flag;
    case 'konsep':
      return BookOpen;
    case 'simulasi':
      return Compass;
    case 'worksheet':
      return ClipboardList;
  }
};

export const LabSidebar: React.FC<LabSidebarProps> = ({
  open,
  onClose,
  activeMainId,
  activeSubId,
  activeView,
  onJumpToSection,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const renderNavContent = (isDrawer: boolean) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Navigasi Cepat
          </p>
          <p className="text-sm font-bold text-slate-900">Bagian Trigonometri Lab</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Sembunyikan sidebar navigasi"
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {isDrawer ? <X className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav aria-label="Daftar bagian modul" className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {LAB_NAV_SECTIONS.map((sec) => {
          const Icon = getSectionIcon(sec.id);
          const isMainActive = activeView === 'student' && activeMainId === sec.id;

          return (
            <div key={sec.id} className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onJumpToSection(sec.id, 'student');
                  if (isDrawer) onClose();
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[40px] rounded-lg text-left transition-colors cursor-pointer ${
                  isMainActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isMainActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="min-w-0">
                    <span
                      className={`block text-[10px] font-semibold uppercase tracking-wider ${
                        isMainActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {sec.stepLabel}
                    </span>
                    <span className="block text-xs sm:text-sm truncate">{sec.shortTitle}</span>
                  </span>
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isMainActive ? 'text-blue-500' : 'text-slate-300'
                  }`}
                />
              </button>

              {sec.children && (
                <div className="pl-4 ml-3 border-l border-slate-200 space-y-0.5">
                  {sec.children.map((sub) => {
                    const isSubActive = activeView === 'student' && activeSubId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          onJumpToSection(sub.id, 'student');
                          if (isDrawer) onClose();
                        }}
                        className={`w-full text-left px-2.5 py-1.5 min-h-[34px] rounded-md text-xs transition-colors cursor-pointer ${
                          isSubActive
                            ? 'bg-blue-50/80 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200 bg-slate-50/60">
        <button
          type="button"
          onClick={() => {
            onJumpToSection(
              activeView === 'teacher' ? 'pengantar' : 'guru',
              activeView === 'teacher' ? 'student' : 'teacher'
            );
            if (isDrawer) onClose();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            activeView === 'teacher'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <span>
            {activeView === 'teacher' ? 'Kembali ke Halaman Siswa' : 'Panel Pemeriksaan Guru'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile & Tablet Slide-Over Drawer (< lg) */}
      <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigasi modul">
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px]"
          onClick={onClose}
          aria-hidden="true"
        />
        <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 shadow-xl">
          {renderNavContent(true)}
        </aside>
      </div>

      {/* Desktop Docked Sticky Sidebar (lg+) */}
      <aside
        aria-label="Sidebar navigasi bagian"
        className="hidden lg:block w-64 shrink-0 sticky top-[112px] self-start max-h-[calc(100vh-128px)] bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        {renderNavContent(false)}
      </aside>
    </>
  );
};
