import { Timestamp } from 'firebase/firestore';

export type LabPresetId = 'mercusuar' | 'drone' | 'tebing' | 'bebas';

export interface SimulationPreset {
  id: LabPresetId;
  label: string;
  contextTitle: string;
  contextDesc: string;
  heightM: number;
  angleDeg: number;
  targetLabel: string;
}

export interface WorksheetDraft {
  studentName: string;
  studentClass: string;
  studentNumber: string;
  simAngleDeg: number;
  simHeightM: number;
  simCalculatedDist: number;
  qConcept1: string;
  qConcept1Reason: string;
  qConcept2: string;
  qCase1Height: string;
  qCase1Angle: string;
  qCase1Distance: string;
  qCase1Steps: string;
  qCase2DistA: string;
  qCase2DistB: string;
  qCase2Gap: string;
  qCase2Steps: string;
  qCase3Answer: string;
  qCase3Strategy: string;
  qHots1Options: string[];
  qHots2Decision: string;
  qHots2Reasoning: string;
  reflectionText: string;
  confidenceLevel: number;
}

export interface SubmissionRecord extends WorksheetDraft {
  id: string;
  studentUid: string;
  studentEmail: string;
  autoScore: number;
  autoMaxScore: number;
  status: 'submitted' | 'graded';
  teacherScore: number;
  teacherFeedback: string;
  gradedBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export const INITIAL_WORKSHEET_DRAFT: WorksheetDraft = {
  studentName: '',
  studentClass: 'X-A',
  studentNumber: '',
  simAngleDeg: 30,
  simHeightM: 45,
  simCalculatedDist: 77.94,
  qConcept1: '',
  qConcept1Reason: '',
  qConcept2: '',
  qCase1Height: '',
  qCase1Angle: '',
  qCase1Distance: '',
  qCase1Steps: '',
  qCase2DistA: '',
  qCase2DistB: '',
  qCase2Gap: '',
  qCase2Steps: '',
  qCase3Answer: '',
  qCase3Strategy: '',
  qHots1Options: [],
  qHots2Decision: '',
  qHots2Reasoning: '',
  reflectionText: '',
  confidenceLevel: 4,
};

export const TEACHER_ADMIN_EMAIL = 'santika.dex@gmail.com';
