export type TrustLevel = "HIGH" | "MODERATE" | "LOW";

export type TrustColor = "success" | "warning" | "danger";

export interface GateResult {
  quality_score: number;
  enhanced: boolean;
}

export interface EvidenceResult {
  ma_count: number;
  hem_count: number;
  ex_count: number;
  vessel_density_pct: number;
  dme_risk: boolean;
  dme_message: string;
}

export interface ClassificationResult {
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface ExplainabilityResult {
  consistency: number;
  verdict: string;
  centroid_distance_dd: number;
  region_overlap: number;
}

export interface TrustResult {
  trust_score: number;
  trust_level: TrustLevel;
  route: string;
}

export interface ScreenResult {
  patient_id: string;
  gate: GateResult;
  evidence: EvidenceResult;
  classification: ClassificationResult;
  explainability: ExplainabilityResult;
  trust: TrustResult;
  report_url?: string;
  timings_ms?: { gate: number; evidence: number; classify: number; explain: number };
}

export interface PatientRecord {
  id: string;
  date: string;
  grade: string;
  confidence: number;
  trust_level: TrustLevel;
  status: "AUTO-CLEARED" | "NEEDS REVIEW" | "URGENT" | "REJECTED";
  dme: boolean;
  result: ScreenResult;
}

export const TRUST_COLORS: Record<TrustLevel, TrustColor> = {
  HIGH: "success",
  MODERATE: "warning",
  LOW: "danger",
};

export const TRUST_THRESHOLD_HIGH = 0.76;
export const TRUST_THRESHOLD_MODERATE = 0.55;

export function trustColor(score: number): TrustColor {
  if (score >= TRUST_THRESHOLD_HIGH) return "success";
  if (score >= TRUST_THRESHOLD_MODERATE) return "warning";
  return "danger";
}

export function trustLevel(score: number): TrustLevel {
  if (score >= TRUST_THRESHOLD_HIGH) return "HIGH";
  if (score >= TRUST_THRESHOLD_MODERATE) return "MODERATE";
  return "LOW";
}

export const CLASS_NAMES = [
  "No DR (Level 0)",
  "Mild NPDR (Level 1)",
  "NPDR - Referable (Level 2-3)",
  "PDR - Urgent (Level 4)",
];

export interface MatlabStatus {
  installed: boolean;
  available: boolean;
  engine: string;
  using: string;
  model_mat: boolean;
  detail?: string;
}
