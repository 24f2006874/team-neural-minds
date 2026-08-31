"use client";

import { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { screenImage } from "@/lib/api";
import { SHOWCASE_RESULTS } from "@/lib/data";
import type { ScreenResult } from "@/lib/types";
import { TrustDial } from "@/components/TrustDial";
import { Reveal } from "@/components/ui";

const STAGES = [
  { key: "gate", label: "Trust Gate", icon: "🔒", detail: "Quality score" },
  { key: "evidence", label: "Evidence Engine", icon: "🧬", detail: "Lesion detection" },
  { key: "classify", label: "Grading CNN", icon: "🧠", detail: "ICDR class" },
  { key: "explain", label: "Grad-CAM", icon: "🔥", detail: "Explainability" },
  { key: "trust", label: "Trust Router", icon: "⚖️", detail: "Final verdict" },
] as const;

export default function Screening() {
  const [patientId, setPatientId] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [completedStage, setCompletedStage] = useState<number>(-1);
  const [activeStage, setActiveStage] = useState<number>(-1);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setResult(null);
    setRunning(false);
    setCompletedStage(-1);
    setActiveStage(-1);
    setError(null);
    setProgress(0);
  }, []);

  const loadFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    reset();
  };

  const loadPreset = (id: string) => {
    const res = SHOWCASE_RESULTS[id];
    if (!res) return;
    setImage(null);
    setImageFile(null);
    setPatientId(id);
    reset();
    // use a placeholder retina gradient so the stepper has something to scan
    setImage(placeholderRetina(id));
    setResult(res);
    setCompletedStage(STAGES.length - 1);
  };

  // Drive the stage animation to match reality using timings
  const runPipeline = async (file: File, pid: string) => {
    setRunning(true);
    setResult(null);
    setError(null);
    setCompletedStage(-1);
    setActiveStage(0);
    setProgress(0);

    const { base } = await screenImage(file, pid);
    setResult(base);

    // Reveal stages sequentially
    const stages = STAGES.length;
    for (let i = 0; i < stages; i++) {
      setActiveStage(i);
      await sleep(650);
      setCompletedStage(i);
      setProgress(((i + 1) / stages) * 100);
    }
    setRunning(false);
  };

  const submit = async () => {
    if (!image) {
      setError("Please upload or choose a sample retina image first.");
      return;
    }
    // If no real file (e.g. from a demo case), synthesise one from the preview
    let file = imageFile;
    if (!file) {
      if (!image.startsWith("data:image")) {
        setError("Please upload an image file.");
        return;
      }
      file = dataURLToFile(image, patientId || "demo");
    }
    await runPipeline(file, patientId || "PATIENT-" + Date.now());
  };

  const downloadReport = () => {
    if (!result) return;
    const body = buildReportText(result);
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DRISHTI-report-${result.patient_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pt-24 px-5 max-w-7xl mx-auto pb-24">
      <Reveal className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Live Screening <span className="text-gradient">App</span>
        </h1>
        <p className="mt-3 text-foreground/60 max-w-2xl mx-auto">
          Upload a retina image (or load a demo case) and watch the entire DRISHTI
          pipeline run live, stage by stage.
        </p>
      </Reveal>

      {/* Preset cases */}
      <Reveal>
        <div className="mb-8 flex flex-wrap items-center gap-2 justify-center">
          <span className="text-xs uppercase tracking-wider text-foreground/50 mr-1">
            Demo cases:
          </span>
          {["SEVERE-001", "REVIEW-001", "PATIENT-001", "NORMAL-001", "BADPHOTO-001"].map((id) => (
            <button
              key={id}
              onClick={() => loadPreset(id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: upload */}
        <Reveal>
          <div className="glass p-6">
            <h2 className="font-bold text-white mb-4">1. Patient photo</h2>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) loadFile(f);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
              className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              {image ? (
                <div className="relative mx-auto w-40 h-40 rounded-full overflow-hidden border border-primary/40">
                  <img src={image} alt="Retina preview" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/10" />
                </div>
              ) : (
                <div className="py-6">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-foreground/70 text-sm">
                    Drag & drop a retina photo, or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-foreground/40 mt-2">
                    On mobile, you can capture from your camera
                  </p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
              />
            </div>

            <label className="block mt-5 text-sm text-foreground/60">Patient ID</label>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. PATIENT-001"
              className="mt-1 w-full px-4 py-2.5 rounded-lg bg-surface2/60 border border-white/10 focus:border-primary/50 focus:outline-none text-sm"
            />

            {error && (
              <p className="mt-3 text-sm text-danger">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={running}
              className="mt-5 w-full py-3 rounded-full bg-primary text-surface font-medium hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
            >
              {running ? "Running pipeline…" : "Run DRISHTI pipeline →"}
            </button>
            <p className="mt-3 text-[11px] text-foreground/40 text-center">
              Pipeline runs on the FastAPI backend (~6s). Demo data works offline.
            </p>
          </div>
        </Reveal>

        {/* RIGHT: live pipeline */}
        <Reveal delay={0.1}>
          <div className="glass p-6 h-full">
            <h2 className="font-bold text-white mb-4">2. Live pipeline run</h2>

            {/* Stage stepper */}
            <div className="space-y-2.5 mb-6">
              {STAGES.map((s, i) => {
                const done = i <= completedStage;
                const active = i === activeStage && running;
                const errorStage = result?.classification.predicted_class.includes("REJECTED") && i === 0;
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 border ${
                      errorStage
                        ? "border-danger/40 bg-danger/10"
                        : done
                        ? "border-success/40 bg-success/10"
                        : active
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/5 bg-surface2/40 opacity-50"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full grid place-items-center text-[11px] shrink-0 ${
                        errorStage
                          ? "bg-danger text-surface"
                          : done
                          ? "bg-success text-surface"
                          : active
                          ? "bg-primary text-surface"
                          : "bg-white/10 text-foreground/50"
                      }`}
                    >
                      {errorStage ? "✕" : done ? "✓" : active ? "…" : i + 1}
                    </span>
                    <span className="text-sm">{s.icon} {s.label}</span>
                    <span className="ml-auto text-xs text-foreground/50 tabular">
                      {errorStage && "rejected"}
                      {active && "~1s"}
                      {done && s.detail}
                    </span>
                  </div>
                );
              })}
              {running && (
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>

            {/* Image + laser sweep while running */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 h-44 grid place-items-center bg-surface2/40">
              {image ? (
                <>
                  <img src={image} alt="Retina being analyzed" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                  {running && (
                    <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-laser-sweep" />
                  )}
                </>
              ) : (
                <span className="text-foreground/30 text-sm">
                  {running ? "Analyzing…" : "Analysis will appear here"}
                </span>
              )}
            </div>

            {/* Result */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="mt-6"
                >
                  <ClinicalReport
                    result={result}
                    onDownload={downloadReport}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function ClinicalReport({
  result,
  onDownload,
}: {
  result: ScreenResult;
  onDownload: () => void;
}) {
  const rejected = result.classification.predicted_class.includes("REJECTED");
  const trust = result.trust;
  const trustHex =
    trust.trust_level === "HIGH" ? "#34D399" : trust.trust_level === "MODERATE" ? "#FBBF24" : "#F87171";

  if (rejected) {
    return (
      <div className="glass p-6 border-danger/40">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⛔</span>
          <div>
            <h3 className="text-lg font-bold text-danger">Image Rejected</h3>
            <p className="text-sm text-foreground/60">
              Quality score {Math.round(result.gate.quality_score * 100)}% — below the acceptance threshold
            </p>
          </div>
        </div>
        <p className="text-sm text-foreground/70">
          This image is too blurry or poorly lit for reliable screening. Please
          retake the photo with better lighting and focus, then resubmit.
        </p>
        <button
          onClick={onDownload}
          className="mt-4 px-4 py-2 rounded-full border border-danger/40 text-danger text-sm hover:bg-danger/10 transition-colors"
        >
          Download quality report
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white">Clinical Report</h3>
        <span className="text-xs text-foreground/40 tabular">{result.patient_id}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="text-center">
          <div className="text-lg font-semibold text-white leading-tight">
            {result.classification.predicted_class}
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Confidence{" "}
            <span className="tabular font-medium text-warning">
              {(result.classification.confidence * 100).toFixed(1)}%
            </span>
          </p>
          <div className="mt-4 flex justify-center">
            <TrustDial score={trust.trust_score} size={130} label="trust" />
          </div>
          <p className="text-xs text-foreground/50 mt-2">{trust.route}</p>
        </div>

        <div>
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-3"
            style={{ backgroundColor: `${trustHex}14`, border: `1px solid ${trustHex}44` }}
          >
            <span className="text-sm font-semibold" style={{ color: trustHex }}>
              TRUST: {trust.trust_level}
            </span>
            <span className="text-xs text-foreground/60">
              Consistent & explainable
            </span>
          </div>

          {result.evidence.dme_risk && (
            <div className="p-3 rounded-lg mb-3 bg-danger/10 border border-danger/40">
              <p className="text-sm font-semibold text-danger">⚠ DME risk detected</p>
              <p className="text-xs text-foreground/70 mt-1">{result.evidence.dme_message}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="MAs" value={result.evidence.ma_count} />
            <MiniStat label="Hems" value={result.evidence.hem_count} />
            <MiniStat label="Exud" value={result.evidence.ex_count} />
          </div>

          <div className="mt-3 text-xs text-foreground/50">
            Referral: {result.explainability.consistency >= 0.5 ? "Refer to specialist" : "Counsel & rescreen"}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onDownload}
          className="flex-1 py-2.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
        >
          ⬇ Download report PDF
        </button>
        <button className="flex-1 py-2.5 rounded-full bg-success/15 border border-success/40 text-success text-sm font-medium hover:bg-success/25 transition-colors">
          → Send to review queue
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface2/60 rounded-lg p-2">
      <p className="tabular text-base font-bold text-white">{value}</p>
      <p className="text-[10px] text-foreground/50 uppercase">{label}</p>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function dataURLToFile(dataUrl: string, name: string): File {
  const [meta, base64] = dataUrl.split(",");
  const mime = (meta.match(/data:(.*?);/) || [])[1] || "image/png";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], `${name}.png`, { type: mime });
}

function placeholderRetina(id: string): string {
  // A simple data URI with a gradient to act as the "retina" for demo runs
  const hue = id.includes("SEVERE") ? "220" : id.includes("BAD") ? "0" : "150";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='%230a0a0f'/><circle cx='100' cy='100' r='70' fill='none' stroke='%23${hue}' opacity='0.4'/><circle cx='100' cy='100' r='50' fill='url(%23g)'/><defs><radialGradient id='g'><stop offset='0%' stop-color='hsl(${hue},70%,50%)'/><stop offset='100%' stop-color='hsl(${hue},50%,20%)'/></radialGradient></defs></svg>`;
  return "data:image/svg+xml," + svg;
}

function buildReportText(r: ScreenResult): string {
  return [
    "DRISHTI — Trust-Gated DR Screening",
    "================================",
    `Patient ID: ${r.patient_id}`,
    "",
    "TRUST GATE",
    `  Quality score: ${(r.gate.quality_score * 100).toFixed(0)}%`,
    `  Enhanced: ${r.gate.enhanced ? "yes" : "no"}`,
    "",
    "EVIDENCE ENGINE",
    `  Microaneurysms: ${r.evidence.ma_count}`,
    `  Hemorrhages: ${r.evidence.hem_count}`,
    `  Exudates: ${r.evidence.ex_count}`,
    `  Vessel density: ${r.evidence.vessel_density_pct}%`,
    `  DME risk: ${r.evidence.dme_risk ? "YES" : "no"}`,
    r.evidence.dme_message ? `  ${r.evidence.dme_message}` : "",
    "",
    "CLASSIFICATION",
    `  Predicted: ${r.classification.predicted_class}`,
    `  Confidence: ${(r.classification.confidence * 100).toFixed(1)}%`,
    "",
    "EXPLAINABILITY",
    `  Consistency: ${r.explainability.consistency.toFixed(2)}`,
    `  Verdict: ${r.explainability.verdict}`,
    "",
    "TRUST ROUTER",
    `  Trust score: ${(r.trust.trust_score * 100).toFixed(0)}%`,
    `  Trust level: ${r.trust.trust_level}`,
    `  Route: ${r.trust.route}`,
    "",
    "Validated on 550 held-out APTOS images. Not certified.",
    "Data: APTOS 2019, Aravind Eye Hospital.",
  ]
    .filter(Boolean)
    .join("\n");
}
