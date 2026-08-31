import {
  PatientRecord,
  ScreenResult,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const SHOWCASE_RESULTS: Record<string, ScreenResult> = {
  "SEVERE-001": {
    patient_id: "SEVERE-001",
    gate: { quality_score: 0.81, enhanced: true },
    evidence: {
      ma_count: 100,
      hem_count: 41,
      ex_count: 22,
      vessel_density_pct: 11.3,
      dme_risk: true,
      dme_message: "URGENT: exudate within 0.29 DD of fovea",
    },
    classification: {
      predicted_class: "NPDR - Referable (Level 2-3)",
      confidence: 0.658,
      probabilities: {
        "No DR (Level 0)": 0.27,
        "Mild NPDR (Level 1)": 0.0,
        "NPDR - Referable (Level 2-3)": 0.658,
        "PDR - Urgent (Level 4)": 0.072,
      },
    },
    explainability: {
      consistency: 0.903,
      verdict: "HIGH",
      centroid_distance_dd: 0.73,
      region_overlap: 1.0,
    },
    trust: {
      trust_score: 0.789,
      trust_level: "HIGH",
      route: "TRUSTED - auto screening recommendation",
    },
    timings_ms: { gate: 820, evidence: 980, classify: 1200, explain: 2100 },
  },
  "REVIEW-001": {
    patient_id: "REVIEW-001",
    gate: { quality_score: 0.63, enhanced: false },
    evidence: {
      ma_count: 38,
      hem_count: 12,
      ex_count: 5,
      vessel_density_pct: 8.7,
      dme_risk: false,
      dme_message: "",
    },
    classification: {
      predicted_class: "NPDR - Referable (Level 2-3)",
      confidence: 0.51,
      probabilities: {
        "No DR (Level 0)": 0.34,
        "Mild NPDR (Level 1)": 0.15,
        "NPDR - Referable (Level 2-3)": 0.51,
        "PDR - Urgent (Level 4)": 0.0,
      },
    },
    explainability: {
      consistency: 0.61,
      verdict: "MODERATE",
      centroid_distance_dd: 1.4,
      region_overlap: 0.72,
    },
    trust: {
      trust_score: 0.64,
      trust_level: "MODERATE",
      route: "REVIEW - needs human confirmation",
    },
    timings_ms: { gate: 850, evidence: 1010, classify: 1240, explain: 2150 },
  },
  "PATIENT-001": {
    patient_id: "PATIENT-001",
    gate: { quality_score: 0.77, enhanced: true },
    evidence: {
      ma_count: 12,
      hem_count: 3,
      ex_count: 0,
      vessel_density_pct: 6.2,
      dme_risk: false,
      dme_message: "",
    },
    classification: {
      predicted_class: "Mild NPDR (Level 1)",
      confidence: 0.62,
      probabilities: {
        "No DR (Level 0)": 0.3,
        "Mild NPDR (Level 1)": 0.62,
        "NPDR - Referable (Level 2-3)": 0.08,
        "PDR - Urgent (Level 4)": 0.0,
      },
    },
    explainability: {
      consistency: 0.88,
      verdict: "HIGH",
      centroid_distance_dd: 0.9,
      region_overlap: 1.0,
    },
    trust: {
      trust_score: 0.81,
      trust_level: "HIGH",
      route: "TRUSTED - auto screening recommendation",
    },
    timings_ms: { gate: 800, evidence: 960, classify: 1180, explain: 2050 },
  },
  "NORMAL-001": {
    patient_id: "NORMAL-001",
    gate: { quality_score: 0.86, enhanced: true },
    evidence: {
      ma_count: 0,
      hem_count: 0,
      ex_count: 0,
      vessel_density_pct: 5.1,
      dme_risk: false,
      dme_message: "",
    },
    classification: {
      predicted_class: "No DR (Level 0)",
      confidence: 0.91,
      probabilities: {
        "No DR (Level 0)": 0.91,
        "Mild NPDR (Level 1)": 0.07,
        "NPDR - Referable (Level 2-3)": 0.02,
        "PDR - Urgent (Level 4)": 0.0,
      },
    },
    explainability: {
      consistency: 0.97,
      verdict: "HIGH",
      centroid_distance_dd: 0.2,
      region_overlap: 1.0,
    },
    trust: {
      trust_score: 0.94,
      trust_level: "HIGH",
      route: "TRUSTED - auto screening recommendation",
    },
    timings_ms: { gate: 790, evidence: 940, classify: 1140, explain: 2010 },
  },
  "BADPHOTO-001": {
    patient_id: "BADPHOTO-001",
    gate: { quality_score: 0.38, enhanced: false },
    evidence: {
      ma_count: 0,
      hem_count: 0,
      ex_count: 0,
      vessel_density_pct: 3.1,
      dme_risk: false,
      dme_message: "",
    },
    classification: {
      predicted_class: "REJECTED - Poor Image Quality",
      confidence: 0.0,
      probabilities: {
        "No DR (Level 0)": 0,
        "Mild NPDR (Level 1)": 0,
        "NPDR - Referable (Level 2-3)": 0,
        "PDR - Urgent (Level 4)": 0,
      },
    },
    explainability: {
      consistency: 0.0,
      verdict: "REJECTED",
      centroid_distance_dd: 0,
      region_overlap: 0,
    },
    trust: {
      trust_score: 0.38,
      trust_level: "LOW",
      route: "REJECTED - recapture image",
    },
    timings_ms: { gate: 700, evidence: 0, classify: 0, explain: 0 },
  },
};

export const PATIENTS: PatientRecord[] = [
  {
    id: "SEVERE-001",
    date: "2026-09-01",
    grade: "NPDR - Referable (Level 2-3)",
    confidence: 0.658,
    trust_level: "HIGH",
    status: "AUTO-CLEARED",
    dme: true,
    result: SHOWCASE_RESULTS["SEVERE-001"],
  },
  {
    id: "REVIEW-001",
    date: "2026-09-01",
    grade: "NPDR - Referable (Level 2-3)",
    confidence: 0.51,
    trust_level: "MODERATE",
    status: "NEEDS REVIEW",
    dme: false,
    result: SHOWCASE_RESULTS["REVIEW-001"],
  },
  {
    id: "PATIENT-001",
    date: "2026-09-01",
    grade: "Mild NPDR (Level 1)",
    confidence: 0.62,
    trust_level: "HIGH",
    status: "AUTO-CLEARED",
    dme: false,
    result: SHOWCASE_RESULTS["PATIENT-001"],
  },
  {
    id: "NORMAL-001",
    date: "2026-08-31",
    grade: "No DR (Level 0)",
    confidence: 0.91,
    trust_level: "HIGH",
    status: "AUTO-CLEARED",
    dme: false,
    result: SHOWCASE_RESULTS["NORMAL-001"],
  },
  {
    id: "DEMO-014",
    date: "2026-08-31",
    grade: "PDR - Urgent (Level 4)",
    confidence: 0.74,
    trust_level: "LOW",
    status: "URGENT",
    dme: true,
    result: {
      patient_id: "DEMO-014",
      gate: { quality_score: 0.6, enhanced: true },
      evidence: {
        ma_count: 210,
        hem_count: 89,
        ex_count: 44,
        vessel_density_pct: 14.2,
        dme_risk: true,
        dme_message: "URGENT: DME zone detected within foveal region",
      },
      classification: {
        predicted_class: "PDR - Urgent (Level 4)",
        confidence: 0.74,
        probabilities: {
          "No DR (Level 0)": 0.05,
          "Mild NPDR (Level 1)": 0.06,
          "NPDR - Referable (Level 2-3)": 0.15,
          "PDR - Urgent (Level 4)": 0.74,
        },
      },
      explainability: {
        consistency: 0.52,
        verdict: "MODERATE",
        centroid_distance_dd: 1.1,
        region_overlap: 0.8,
      },
      trust: {
        trust_score: 0.49,
        trust_level: "LOW",
        route: "URGENT - immediate escalation",
      },
    },
  },
  {
    id: "DEMO-015",
    date: "2026-08-30",
    grade: "No DR (Level 0)",
    confidence: 0.89,
    trust_level: "HIGH",
    status: "AUTO-CLEARED",
    dme: false,
    result: SHOWCASE_RESULTS["NORMAL-001"],
  },
  {
    id: "BADPHOTO-001",
    date: "2026-08-30",
    grade: "REJECTED - Poor Image Quality",
    confidence: 0.0,
    trust_level: "LOW",
    status: "REJECTED",
    dme: false,
    result: SHOWCASE_RESULTS["BADPHOTO-001"],
  },
];

// ---------- Validation metrics ----------
export const METRICS = {
  // Real numbers from results/aptos/drishti_aptos_results.json (550-test split)
  sensitivity: 91.0,
  specificity: 96.0,
  qwk: 0.895,
  auc: 0.975,
  aucMacro: 0.935,
  held_out: 550,
  referableSensitivity: 0.9103,
  referableSpecificity: 0.9602,
  perClassRecall: {
    "No DR (0)": 0.967,
    "Mild NPDR (1)": 0.661,
    "Moderate NPDR (2)": 0.767,
    "Severe NPDR (3)": 0.517,
    "Proliferative DR (4)": 0.455,
  },
  stabilityRuns: [
    { run: 1, sensitivity: 89.5, specificity: 95.0 },
    { run: 2, sensitivity: 91.0, specificity: 96.0 },
    { run: 3, sensitivity: 91.8, specificity: 96.4 },
  ],
  // confusion matrix rows = true class, cols = predicted (5 classes, real)
  confusionMatrix: [
    [262, 8, 1, 0, 0],
    [5, 37, 13, 0, 1],
    [2, 12, 115, 21, 0],
    [1, 0, 6, 15, 7],
    [1, 2, 10, 11, 20],
  ],
  classNames: [
    "No DR (0)",
    "Mild NPDR (1)",
    "Moderate NPDR (2)",
    "Severe NPDR (3)",
    "Proliferative DR (4)",
  ],
  // ROC / referable-threshold trade-off (referable = classes 2-4)
  thresholdCurve: [
    { threshold: 0.2, sensitivity: 96.3, specificity: 78.4 },
    { threshold: 0.3, sensitivity: 94.9, specificity: 85.1 },
    { threshold: 0.4, sensitivity: 92.6, specificity: 91.2 },
    { threshold: 0.5, sensitivity: 91.0, specificity: 96.0 },
    { threshold: 0.6, sensitivity: 89.2, specificity: 97.4 },
    { threshold: 0.7, sensitivity: 86.7, specificity: 98.6 },
    { threshold: 0.8, sensitivity: 83.0, specificity: 99.2 },
  ],
  rocPoints: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.02, tpr: 0.63 },
    { fpr: 0.05, tpr: 0.84 },
    { fpr: 0.09, tpr: 0.91 },
    { fpr: 0.18, tpr: 0.955 },
    { fpr: 0.34, tpr: 0.985 },
    { fpr: 0.6, tpr: 1.0 },
    { fpr: 1, tpr: 1 },
  ],
  trainingCurves: {
    epochs: Array.from({ length: 30 }, (_, i) => i + 1),
    trainLoss: [
      1.9, 1.5, 1.1, 0.9, 0.75, 0.65, 0.58, 0.53, 0.49, 0.46, 0.43, 0.41,
      0.39, 0.38, 0.36, 0.35, 0.34, 0.33, 0.32, 0.31, 0.31, 0.3, 0.3, 0.29,
      0.29, 0.28, 0.28, 0.27, 0.27, 0.26,
    ],
    valLoss: [
      2.1, 1.7, 1.4, 1.15, 0.95, 0.82, 0.73, 0.67, 0.62, 0.59, 0.56, 0.54,
      0.53, 0.52, 0.51, 0.5, 0.5, 0.49, 0.49, 0.48, 0.48, 0.48, 0.47, 0.47,
      0.47, 0.46, 0.46, 0.46, 0.46, 0.45,
    ],
  },
};

// ---------- Capacity model ----------
export function computeCapacity(cams: number, reviewers: number, arrivals: number) {
  const patientsPerDay = Math.round(arrivals * 12);
  const patientsPerYear = patientsPerDay * 300;
  // simple M/M/c-ish model
  const serviceRate = 0.45; // per camera per min ~ ~27/hour
  const utilization = Math.min(0.97, arrivals / (cams * serviceRate * 60));
  const queue = Math.max(0, (utilization * utilization) / (1 - utilization));
  const meanWaitMin = (queue / Math.max(1, arrivals)) * 12;
  return {
    patientsPerDay,
    patientsPerYear,
    meanWait: Math.round(meanWaitMin * 10) / 10,
    utilization: Math.round(utilization * 100),
    queueLength: Math.round(queue),
  };
}

export const CAPACITY_PRESETS = {
  "Single PHC": { cams: 1, reviewers: 1, arrivals: 12 },
  "District pilot": { cams: 3, reviewers: 2, arrivals: 25 },
  "State scale": { cams: 8, reviewers: 5, arrivals: 50 },
};

export const TEAM = [
  { name: "Team Neural Minds", role: "Core development team", desc: "Built the full pipeline end-to-end — quality gate, evidence engine, CNN grading, Grad-CAM explainability, and the trust router." },
];

export const PS_INFO = {
  psId: "PS 26038",
  sponsor: "MathWorks",
  title: "Trust-Gated Diabetic Retinopathy Screening",
};
