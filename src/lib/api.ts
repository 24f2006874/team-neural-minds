import { API_URL, PATIENTS } from "./data";
import type { MatlabStatus, PatientRecord, ScreenResult } from "./types";

/**
 * Thin API client. Tries the real FastAPI backend first; falls back to
 * realistic mock data (matching the exact JSON contract) when the backend
 * isn't running — so the whole site works offline for demos.
 */

export async function screenImage(
  file: File,
  patientId: string
): Promise<{ base: ScreenResult; dataUrl: string }> {
  const dataUrl = await readAsDataURL(file);
  try {
    const form = new FormData();
    form.append("file", file);
    form.append("patient_id", patientId || "DEMO");
    const res = await fetch(`${API_URL}/api/screen`, {
      method: "POST",
      body: form,
    });
    if (res.ok) {
      const json = await res.json();
      return { base: json, dataUrl };
    }
    throw new Error("backend unavailable");
  } catch {
    // Use a realistic mock based on patient ID, falling back to a default
    const mock = mockForPatient(patientId);
    return { base: mock, dataUrl };
  }
}

export async function fetchPatients(filter?: string): Promise<PatientRecord[]> {
  try {
    const res = await fetch(`${API_URL}/api/patients?filter=${filter || ""}`, {
      cache: "no-store",
    });
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    return applyFilter(PATIENTS, filter);
  }
}

export async function fetchPatient(id: string): Promise<PatientRecord | undefined> {
  try {
    const res = await fetch(`${API_URL}/api/patients/${id}`, { cache: "no-store" });
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    return PATIENTS.find((p) => p.id === id);
  }
}

export async function fetchMetrics() {
  try {
    const res = await fetch(`${API_URL}/api/metrics`, { cache: "no-store" });
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    return null; // caller uses local METRICS
  }
}

export async function fetchCapacity(cams: number, revw: number, arr: number) {
  try {
    const res = await fetch(
      `${API_URL}/api/capacity?cams=${cams}&revw=${revw}&arr=${arr}`,
      { cache: "no-store" }
    );
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    return null;
  }
}

export async function fetchMatlabStatus(): Promise<MatlabStatus | null> {
  try {
    const res = await fetch(`${API_URL}/api/matlab_status`, { cache: "no-store" });
    if (res.ok) return await res.json();
    throw new Error();
  } catch {
    return null;
  }
}

// ---------- helpers ----------
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mockForPatient(id: string): ScreenResult {
  const key = Object.keys(sizingCases).includes(id)
    ? id
    : "PATIENT-001";
  return sizingCases[key];
}

import { SHOWCASE_RESULTS } from "./data";
const sizingCases = SHOWCASE_RESULTS;

function applyFilter(records: PatientRecord[], filter?: string): PatientRecord[] {
  if (!filter || filter === "all") return records;
  switch (filter) {
    case "cleared":
      return records.filter((r) => r.trust_level === "HIGH");
    case "review":
      return records.filter((r) => r.trust_level === "MODERATE");
    case "urgent":
      return records.filter((r) => r.trust_level === "LOW" || r.dme);
    default:
      return records;
  }
}
