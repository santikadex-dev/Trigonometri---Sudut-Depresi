import { WorksheetDraft } from '../types/worksheet';

export interface AutoCheckItem {
  id: string;
  label: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  hint: string;
}

export interface AutoEvaluationResult {
  totalScore: number;
  maxScore: number;
  items: AutoCheckItem[];
}

export function parseNumericInput(raw: string): number | null {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(',', '.')
    .replace(/meter|m|derajat|°/g, '')
    .trim();

  if (!cleaned) return null;

  // Handle simple radical expressions like 50 akar 3 or 50/akar 3 or 40√3
  const sqrt3Match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(?:\*|\s)?(?:√3|akar\s*3)$/);
  if (sqrt3Match) {
    return parseFloat(sqrt3Match[1]) * Math.sqrt(3);
  }
  const divSqrt3Match = cleaned.match(/^(\d+(?:\.\d+)?)\s*\/\s*(?:√3|akar\s*3)$/);
  if (divSqrt3Match) {
    return parseFloat(divSqrt3Match[1]) / Math.sqrt(3);
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function isApprox(raw: string, target: number, tolerance = 0.6): boolean {
  const val = parseNumericInput(raw);
  if (val === null) return false;
  return Math.abs(val - target) <= tolerance;
}

export function evaluateObjectiveAnswers(draft: WorksheetDraft): AutoEvaluationResult {
  const items: AutoCheckItem[] = [];

  // 1. Concept Check 1 (10 pts): Sudut depresi diukur dari dinding menara? -> Salah ('false')
  const c1Ok = draft.qConcept1 === 'false';
  items.push({
    id: 'qConcept1',
    label: 'Cek Konsep 1: Acuan Sudut Depresi',
    isCorrect: c1Ok,
    earnedPoints: c1Ok ? 10 : 0,
    maxPoints: 10,
    hint: c1Ok
      ? 'Tepat! Sudut depresi selalu diukur dari garis horizontal sejajar mata pengamat ke arah bawah.'
      : 'Perlu dicermati lagi: sudut depresi diukur dari garis pandang horizontal (mendatar), bukan dari dinding vertikal.',
  });

  // 2. Concept Check 2 (10 pts): Sudut depresi = sudut elevasi dari target? -> Benar ('true')
  const c2Ok = draft.qConcept2 === 'true';
  items.push({
    id: 'qConcept2',
    label: 'Cek Konsep 2: Sudut Dalam Berseberangan',
    isCorrect: c2Ok,
    earnedPoints: c2Ok ? 10 : 0,
    maxPoints: 10,
    hint: c2Ok
      ? 'Tepat! Dua garis horizontal yang sejajar menghasilkan pasangan sudut dalam berseberangan yang sama besar.'
      : 'Ingat sifat dua garis sejajar: sudut depresi di atas sama besar dengan sudut elevasi dari titik target.',
  });

  // 3. Kasus A (Mudah, 15 pts total): h = 30, angle = 45, d = 30
  const k1H = isApprox(draft.qCase1Height, 30, 0.2);
  const k1A = isApprox(draft.qCase1Angle, 45, 0.2);
  const k1D = isApprox(draft.qCase1Distance, 30, 0.5);
  const k1Pts = (k1H ? 4 : 0) + (k1A ? 4 : 0) + (k1D ? 7 : 0);
  items.push({
    id: 'qCase1',
    label: 'Kasus A (Mudah): Menara Pengawas Pantai',
    isCorrect: k1H && k1A && k1D,
    earnedPoints: k1Pts,
    maxPoints: 15,
    hint:
      k1H && k1A && k1D
        ? 'Benar semua! Karena tan(45°) = 1, maka jarak horizontal kapal sama dengan tinggi menara yaitu 30 m.'
        : 'Periksa identifikasi h = 30 m, θ = 45°, dan d = 30 / tan(45°) = 30 m.',
  });

  // 4. Kasus B (Sedang, 25 pts total): h = 50, A = 60° (dA ≈ 28.87), B = 30° (dB ≈ 86.60), gap ≈ 57.74
  const k2A = isApprox(draft.qCase2DistA, 50 / Math.sqrt(3), 0.7);
  const k2B = isApprox(draft.qCase2DistB, 50 * Math.sqrt(3), 0.8);
  const k2G = isApprox(draft.qCase2Gap, 50 * Math.sqrt(3) - 50 / Math.sqrt(3), 1.0);
  const k2Pts = (k2A ? 8 : 0) + (k2B ? 8 : 0) + (k2G ? 9 : 0);
  items.push({
    id: 'qCase2',
    label: 'Kasus B (Sedang): Drone Pemantau Dua Mobil',
    isCorrect: k2A && k2B && k2G,
    earnedPoints: k2Pts,
    maxPoints: 25,
    hint:
      k2A && k2B && k2G
        ? 'Luar biasa! d_A ≈ 28,9 m, d_B ≈ 86,6 m, sehingga jarak antar mobil adalah 57,7 m.'
        : 'Hitung d_A = 50/tan(60°) ≈ 28,9 m dan d_B = 50/tan(30°) ≈ 86,6 m, lalu cari selisihnya (≈ 57,7 m).',
  });

  // 5. Kasus C (Sulit, 15 pts objektif + dinilai guru untuk strategi): Δd = 60√3 - 20√3 = 40√3 ≈ 69.28 m
  const k3Ok = isApprox(draft.qCase3Answer, 40 * Math.sqrt(3), 1.2);
  items.push({
    id: 'qCase3',
    label: 'Kasus C (Sulit): Operasi Penyelamatan Tebing SAR',
    isCorrect: k3Ok,
    earnedPoints: k3Ok ? 15 : 0,
    maxPoints: 15,
    hint: k3Ok
      ? 'Sangat tepat! Perahu menempuh jarak sekitar 69,3 m (40√3 m) mendekati tebing.'
      : 'Gunakan d₁ = 60/tan(30°) ≈ 103,9 m dan d₂ = 60/tan(60°) ≈ 34,6 m, lalu hitung Δd = d₁ - d₂ ≈ 69,3 m.',
  });

  // 6. AKM 1 (Pilihan Ganda Kompleks, 15 pts): Correct options ['B', 'C']
  // Statements:
  // A: Sudut elevasi dari pelampung adalah 35° (Salah - karena 35° diukur dari tebing vertikal, jadi sudut depresinya 90°-35°=55°)
  // B: Sudut depresi sebenarnya yang diukur dari garis horizontal adalah 55° (Benar)
  // C: Nilai jarak horizontal seharusnya dihitung dengan 40 / tan(55°) atau 40 × tan(35°) (Benar)
  // D: Semakin besar sudut depresi, semakin jauh jarak benda dari kaki tebing (Salah)
  const sortedHots1 = [...draft.qHots1Options].sort();
  const hots1Exact =
    sortedHots1.length === 2 && sortedHots1[0] === 'B' && sortedHots1[1] === 'C';
  let hots1Pts = 0;
  if (hots1Exact) {
    hots1Pts = 15;
  } else {
    const correctSelected = sortedHots1.filter((o) => o === 'B' || o === 'C').length;
    const wrongSelected = sortedHots1.filter((o) => o !== 'B' && o !== 'C').length;
    hots1Pts = Math.max(0, correctSelected * 7 - wrongSelected * 5);
  }
  items.push({
    id: 'qHots1',
    label: 'Evaluasi AKM 1: Analisis Kesalahan Pengukuran',
    isCorrect: hots1Exact,
    earnedPoints: hots1Pts,
    maxPoints: 15,
    hint: hots1Exact
      ? 'Analisis tepat! Sudut 35° terhadap tebing vertikal berarti sudut depresi dari horizontal adalah 90° - 35° = 55°.'
      : 'Pernyataan yang benar adalah B dan C: sudut terhadap garis horizontal adalah 55°, sehingga d = 40 / tan(55°).',
  });

  // 7. AKM 2 (Keputusan Data, 10 pts): h = 40 m, batas aman > 45 m, θ = 53° (tan 53° ≈ 4/3 => d ≈ 30 m < 45 m -> Berbahaya)
  const hots2Ok = draft.qHots2Decision === 'Berbahaya';
  items.push({
    id: 'qHots2',
    label: 'Evaluasi AKM 2: Keputusan Navigasi Karang',
    isCorrect: hots2Ok,
    earnedPoints: hots2Ok ? 10 : 0,
    maxPoints: 10,
    hint: hots2Ok
      ? 'Keputusan akurat! Jarak kapal ≈ 30 m lebih kecil dari batas aman karang 45 m.'
      : 'Hitung d = 40 / tan(53°) ≈ 40 / (4/3) = 30 m. Karena 30 m ≤ 45 m, kapal berada di zona berbahaya!',
  });

  const totalScore = items.reduce((acc, item) => acc + item.earnedPoints, 0);
  const maxScore = items.reduce((acc, item) => acc + item.maxPoints, 0);

  return { totalScore, maxScore, items };
}

export function sanitizeSubmissionPayload(draft: WorksheetDraft) {
  const clamp = (val: number, min: number, max: number) =>
    Math.min(max, Math.max(min, Number.isFinite(val) ? val : min));

  const clip = (str: string, max: number) => (str || '').trim().slice(0, max);

  return {
    studentName: clip(draft.studentName, 120),
    studentClass: clip(draft.studentClass, 40),
    studentNumber: clip(draft.studentNumber, 20),
    simAngleDeg: clamp(draft.simAngleDeg, 5, 85),
    simHeightM: clamp(draft.simHeightM, 1, 500),
    simCalculatedDist: clamp(Number(draft.simCalculatedDist.toFixed(2)), 0, 10000),
    qConcept1: clip(draft.qConcept1, 20),
    qConcept1Reason: clip(draft.qConcept1Reason, 1000),
    qConcept2: clip(draft.qConcept2, 20),
    qCase1Height: clip(draft.qCase1Height, 50),
    qCase1Angle: clip(draft.qCase1Angle, 50),
    qCase1Distance: clip(draft.qCase1Distance, 50),
    qCase1Steps: clip(draft.qCase1Steps, 2000),
    qCase2DistA: clip(draft.qCase2DistA, 50),
    qCase2DistB: clip(draft.qCase2DistB, 50),
    qCase2Gap: clip(draft.qCase2Gap, 50),
    qCase2Steps: clip(draft.qCase2Steps, 2000),
    qCase3Answer: clip(draft.qCase3Answer, 50),
    qCase3Strategy: clip(draft.qCase3Strategy, 2500),
    qHots1Options: (draft.qHots1Options || []).slice(0, 4).map((o) => clip(o, 10)),
    qHots2Decision: clip(draft.qHots2Decision, 100),
    qHots2Reasoning: clip(draft.qHots2Reasoning, 2000),
    reflectionText: clip(draft.reflectionText, 2000),
    confidenceLevel: clamp(Math.round(draft.confidenceLevel || 3), 1, 5),
  };
}
